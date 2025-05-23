# i++

- [i++](#i)
  - [About](#about)
  - [Usage](#usage)
  - [Working principles](#working-principles)
    - [Default header](#default-header)
    - [`origin` global query parameter](#origin-global-query-parameter)
  - [Endpoints](#endpoints)
    - [Standard JSON](#standard-json)
    - [SVG](#svg)
      - [Query Parameters](#query-parameters)
    - [Prometheus](#prometheus)
  - [Service deployment](#service-deployment)
    - [Deploment configuration](#deploment-configuration)
    - [Deploy](#deploy)
    - [Teardown](#teardown)
  - [TODOs](#todos)

## About
> With the deprecation of the popular repo <https://github.com/gjbae1212/hit-counter>, it is time to revive this project again.

Count daily and overall website visits:

<a href="https://github.com/hikkoiri/i-plus-plus" target="_blank">
    <img alt="Page visit counter" src="https://i-plus-plus.carlo-hildebrandt.de/svg?origin=github.com/hikkoiri/i-plus-plus" />
</a>


## Usage

Just embed the following code into your project:
```html
<a href="https://github.com/hikkoiri/i-plus-plus" target="_blank">
    <img alt="Page visit counter" src="https://i-plus-plus.carlo-hildebrandt.de/svg" />
</a>
```

## Working principles
The way this service works is quite straight-forward. By calling this service the number of daily visits for the respective origin is increased by one. By the end of each day, the daily count will be reset and added to the total amount. There is an implicit and explicit way how the origin is identified. If none is identified it will default to `unknown`.

### Default header
Implicitly the website, where this service can be embedded in, shall provide its hostname in the `referer` header that is read by the service.

### `origin` global query parameter

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
{
  "origin" : "unknown",
  "allTimeCount" : 5,
  "dailyCount" : 3
}
```

### SVG

Inspired by <https://github.com/hikkoiri/go-counter-badge> you may want to display a counter on your website.
``` bash
curl https://i-plus-plus.carlo-hildebrandt.de/
```
returns

<a href="https://github.com/hikkoiri/i-plus-plus" target="_blank">
    <img alt="Page visit counter" src="https://i-plus-plus.carlo-hildebrandt.de/svg?origin=github.com/hikkoiri/i-plus-plus" />
</a>

If no origin is identified following badge is returned:

<a href="https://github.com/hikkoiri/i-plus-plus" target="_blank">
    <img alt="Page visit counter" src="https://i-plus-plus.carlo-hildebrandt.de/svg?origin=unknown" />
</a>

#### Query Parameters

The following query parameters can be used to customize the SVG output:

| Parameter              | Description                                                                           | Default Value |
| ---------------------- | ------------------------------------------------------------------------------------- | ------------- |
| `language`             | Sets the language for the left text. Supported values: `en` (English), `de` (German). | `en`          |
| `leftBackgroundColor`  | Sets the background color of the left section of the SVG.                             | `"#333333"`   |
| `rightBackgroundColor` | Sets the background color of the right section of the SVG.                            | `"darkgreen"` |

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
- [ ] Make SVG sclaing more elegant 👀
- [ ] Configure timezone for daily merge at midnight (right now UTC is used)
- [ ] Implement CI/CD pipeline
