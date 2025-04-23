# i++

- [i++](#i)
  - [About](#about)
  - [Working principles](#working-principles)
    - [Default header](#default-header)
    - [`origin` global query parameters](#origin-global-query-parameters)
  - [Endpoints](#endpoints)
    - [Standard JSON](#standard-json)
    - [Prometheus](#prometheus)
  - [Service deployment](#service-deployment)
    - [Deploment configuration](#deploment-configuration)
    - [Deploy](#deploy)
    - [Teardown](#teardown)
  - [TODOs](#todos)

## About
> With the deprecation of the popular repo <https://github.com/gjbae1212/hit-counter>, it is time to revive this project again.

Count daily and overall website visits.

## Working principles
The way this service works is quite straight-forward. By calling this service the number of daily visits for the respective origin is increased by one. By the end of each day, the daily count will be reset and added to the total amount. There is an implicit and explicit way how the origin is identified. If none is identified it will default to `unknwown`.

### Default header
Implicitly the website, where this service can be embedded in, shall provide its hostname in the `origin` header that is read by the service.

### `origin` global query parameters

For other use cases, where you cannot append the origin http header or want to intentionally override it, you can append an explicit query parameter in the url path:
```
?origin=test
``` 



##  Endpoints
The service provides several endpoints for different use cases.

### Standard JSON
This is the default route which returns all information in the JSON format. Whenever this endpoint is called

``` bash
curl https://i-plus-plus.carlo-hildebrandt.de/
```
returns
```json
{"origin":"unknown","allTimeCount":5,"dailyCount":3
```


### Prometheus
If you want to scrape the amount of users with prometheus, this is your endpoint. It will not bump the daily count, instead it only provides a read-only endpoint for the state that already matches the required Prometheus data model.

``` bash
curl https://i-plus-plus.carlo-hildebrandt.de/metrics
```
returns
```
daily_count{origin="unknown"} 3
all_time_count{origin="unknown"} 5
```


## Service deployment

You will need an AWS account and the cdk tools to deploy it from your local pc.

### Deploment configuration
You will have to adapt the configurations in `infra/config/prod.ts` to match your needs.

### Deploy

```bash
cd infra && cdk deploy
```

### Teardown

```bash
cdk destroy
```


## TODOs
- [ ] Provide SVG Badge, like: https://github.com/gjbae1212/go-counter-badge
- [ ]  Configure timezone for daily merge at midnight (right now UTC is used)
- [ ]  Implement CI/CD pipeline
