The engine is container based and it gives you various options on how to deploy
the service on your infrastructure. We provide some examples here.

## Kubernetes

The following can serve as example on how to deploy an engine to a Kubernetes cluster.
In this example we are using a service of type NodePort while you in a production-like
scenario probably use `ingress` with an `ingress controller` or a load balancer.

Create a deployment of a FAST engine with the demo plugin in use.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fast-engine-deployment
  labels:
    app: fast-engine
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fast-engine
  template:
    metadata:
      labels:
        app: fast-engine
    spec:
      containers:
      - name: fast-engine
        image: eyevinntechnology/fast-engine:v1.6.0
        env:
        - name: DEMO_NUM_CHANNELS
          value: "10"
        - name: OPTS_USE_DEMUXED_AUDIO
          value: "false"
        - name: OPTS_USE_VTT_SUBTITLES
          value: "false"
        ports:
        - containerPort: 8000
```

Create a service to access the deployed pods.

```
apiVersion: v1
kind: Service
metadata:
  name: fast-engine-service
spec:
  type: NodePort
  selector:
    app: fast-engine
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
    nodePort: 30000
```

Then you can access the engine and playback a channel on for example `http://localhost:30000/channels/1/master.m3u8`
