# i++

- [i++](#i)
  - [About](#about)
  - [Live Demo](#live-demo)
  - [AWS Backend](#aws-backend)
    - [Deploy](#deploy)
    - [Teardown](#teardown)
  - [React Frontend](#react-frontend)
    - [Local development](#local-development)

## About

Did you ever wonder how many people ever visited your website? This project will help you figuring it out. It includes a simple three tier web application using AWS serverless services (so its practically free) which simply counts the amount of API calls against the counting API. The API is exposed over an API gateway, the counting logic is implemented within Lambda, the state is stored within DynamoDB. Pretty straightforward. 

> Yes, the implementation is not perfect  since race conditions can occur. Synchronized database access could be implemented, but for the expected amount of traffic I won't bother with that.

## Live Demo

The feature is currently available on [carlo-hildebrandt.de](https://carlo-hildebrandt.de).

## AWS Backend

### Deploy

```bash
npm run build && cdk deploy
```

### Teardown

```bash
cdk destroy
```


## React Frontend

![Demo](doc/demo.gif)

### Local development
```bash
npm start
```