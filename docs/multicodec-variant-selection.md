# Multicodec master variant selection — where the seam is

Trace of how a multicodec (e.g. HEVC + AVC) master-manifest variant is selected across
`docker-fast`, `eyevinn-channel-engine`, and `@eyevinn/hls-vodtolive`. This is the
scoping finding for the follow-up implementation ticket (#65). It records **the exact
seam**, **which repo must change**, and the **codec-preference** situation.

Line references were verified against the versions currently locked in this repo:

- `@eyevinn/hls-vodtolive` **4.1.5** (`node_modules/@eyevinn/hls-vodtolive/index.js`)
- `eyevinn-channel-engine` **5.0.0** (`node_modules/eyevinn-channel-engine/dist/engine/session.js`)

## Reproduced behavior (from #63)

Given a source master with two variants that advertise the **same BANDWIDTH** but
different codecs (fixture: `src/plugins/__tests__/fixtures/multicodec/master.m3u8`,
BANDWIDTH=2000000 for both `avc1.4d401f` and `hvc1.1.6.L93.90`), the engine's client
master advertises **both** codecs at that bandwidth, but the segments served for that
bandwidth are only **one** variant's — so at least one advertised `CODECS` points at
segments of the wrong codec. Characterization test:
`src/plugins/__tests__/multicodec_master.test.ts`.

## Call path

1. **Engine constructs the VOD and loads it (no codec input).**
   `session.js:1737` `new HLSVod(vodResponse.uri, [], ...)` then
   `session.js:1751`/`1760` `currentVod.load(...)`.
   `HLSVod`'s signatures carry **no** codec preference/filter:

   - constructor `index.js:26` `constructor(vodManifestUri, splices, timeOffset, startTimeOffset, header, opts)` — `opts` (parsed at `index.js:62-85`) has no codec option.
   - `index.js:198` `load(_injectMasterManifest, _injectMediaManifest, _injectAudioManifest, _injectSubtitleManifest)` — all four args are manifest **injectors** (loader overrides), none is a codec selector.

2. **hls-vodtolive parses `#EXT-X-STREAM-INF` variants.**
   `index.js:227-250` iterates `m3u.items.StreamItem`. For each variant it:

   - pushes one entry into `this.usageProfile` with `bw`, `resolution`, and `codecs`
     (`index.js:232-241`) — **one profile per variant, keyed by nothing** (it is a flat
     array, so two variants at the same bandwidth produce two profiles with different
     `codecs`), and
   - schedules `_loadMediaManifest(url, streamItem.get("bandwidth"), ...)`
     (`index.js:246`) — **keyed by bandwidth only**.

3. **Segment buckets are formed by bandwidth, and the first variant wins a colliding bucket.**
   `_loadMediaManifest` (`index.js:2600`) stores segments in `this.segments[bw]` where
   `bw = bandwidth` (`index.js:2603`, `2624-2625`). The body is guarded by
   `if (!this.segmentsInitiated[bw])` (`index.js:2632`); after the first variant fills the
   bucket it sets `this.segmentsInitiated[bw] = true` (`index.js:2844`). A second variant
   colliding on the same bandwidth hits the `else` branch and is **dropped**:
   `Segments for ${bw} already initiated, skipping` (`index.js:2845-2846`). So the
   **first variant in master order wins the bucket**; its codec is the one actually served.

4. **Output surfaces expose the collision.**

   - `getBandwidths()` (`index.js:898-900`) returns `Object.keys(this.segments)` —
     colliding variants collapse to a single bandwidth key.
   - `getUsageProfiles()` (`index.js:1155-1157`) returns `this.usageProfile` — the flat
     array from step 2, which still lists **both** codecs at the colliding bandwidth,
     independent of which variant won the segment bucket.

5. **Engine emits the client master from the usage profiles.**
   `session.js:1516-1523` iterates `currentVod.getUsageProfiles()` and writes one
   `#EXT-X-STREAM-INF:BANDWIDTH=<bw>,...,CODECS="<codecs>"` line per profile, each
   pointing at the same `master<bw>.m3u8` (`session.js:1523`). Both codec lines therefore
   reference the single, bandwidth-keyed segment set from step 3 — hence the mismatch.

## The exact seam

The mismatch originates in **`@eyevinn/hls-vodtolive`**, at the point where variants are
reduced to a bandwidth-keyed index:

- **Segment index is bandwidth-only** — `this.segments[bandwidth]`
  (`index.js:2603`/`2624`), so a codec dimension is lost.
- **First-writer-wins on collision** — `segmentsInitiated[bw]` guard
  (`index.js:2632`, `2844-2846`) silently drops the second colliding variant.
- **`getUsageProfiles()` over-advertises** — it keeps one profile per input variant
  (`index.js:232-241`, returned at `1155-1157`) even though only one variant's segments
  survive, so the engine advertises codecs it cannot serve.

The engine (`session.js:1516-1523`) and `docker-fast` (`src/plugins/utils.ts`,
`plugin_demo.ts`) are only **downstream consumers/emitters** of this data; they do not do
the variant selection and cannot fix it without a change in the library.

## Which repo must change

**`@eyevinn/hls-vodtolive`.** The bandwidth-keyed segment index and the first-writer-wins
collision handling are internal to the library; there is no engine- or docker-fast-level
hook to disambiguate two variants that share a bandwidth. A fix needs the library to key
segments by (bandwidth + codec) — or otherwise carry a codec dimension — so
`getUsageProfiles()`/`getBandwidths()` and the served segments stay consistent. Any change
in the engine or `docker-fast` alone would only mask the symptom (e.g. by not advertising
the extra codec) without letting both codecs actually be served.

## Codec-preference finding

There is currently **no way to express an input-variant codec preference or filter**:

- Neither the `HLSVod` constructor `opts` (`index.js:62-85`) nor `load(...)`
  (`index.js:198`) accepts a codec argument.
- The engine never passes its output profile config into `HLSVod` — `load()` is called
  with only manifest loaders (`session.js:1751`/`1760`), so the profile cannot influence
  which input variant wins a bucket.
- The `codecs` strings in `docker-fast` (`src/plugins/utils.ts:11-17`,
  `src/plugins/plugin_demo.ts:86-88`) are `ChannelProfile` entries used **only for output
  manifest emission** (`CODECS="..."` in the client master, `session.js:1497`/`1507`/`1519`).
  They do not filter or rank the input source variants.

So #65 must both (a) add a codec dimension to the library's variant selection and, if a
preference is desired (e.g. prefer HEVC over AVC when they collide), (b) introduce a way
to express that preference — neither exists today.
