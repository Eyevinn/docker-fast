## Installation

The services uses AWS DynamoDB as database store. 

```
docker run -d -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID=<***> \
  -e AWS_SECRET_ACCESS_KEY=<***> \
  -e AWS_REGION=<aws-region> \
  -e PORT=8080 \
  eyevinntechnology/schedule-service
```

Once up and running the service is available on port 8080 and you can access the API documentation at `http://localhost:8080/api/docs`

For demo and POC purposes you can use a local AWS DynamoDB instance with the Schedule Service. First start a local Dynamo DB instance:

```
docker run -d -p 6000:8000 amazon/dynamodb-local
```

Then start the Schedule Service container with the following command:

```
docker run -d -p 8080:8080 \
  -e DB=dynamodb://host.docker.internal:6000/eu-north-1 \
  -e AWS_ACCESS_KEY_ID=null \
  -e AWS_SECRET_ACCESS_KEY=null \
  -e PORT=8080 \
  eyevinntechnology/schedule-service
```



