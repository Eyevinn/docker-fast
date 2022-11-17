const ENGINE_HOST = window.location.protocol + "//" + window.location.hostname + ":" + (process.env.PORT || "8000");
const ENGINE_URL = ENGINE_HOST + "/health";

window.addEventListener('DOMContentLoaded', async () => {
  const sectionMultiview = document.querySelector("#multiview");

  console.log(ENGINE_URL);
  const response = await fetch(ENGINE_URL);
  if (response.ok) {
    const json = await response.json();
    console.log(json);
    if (json.sessionEndpoints) {
      json.sessionEndpoints.forEach(endpoint => {
        const video = document.createElement("eyevinn-video");
        video.setAttribute("source", ENGINE_HOST + endpoint.playback);
        video.setAttribute("autoplay", "");
        video.setAttribute("muted", "");
        sectionMultiview.appendChild(video);
      });
    }
  }
});