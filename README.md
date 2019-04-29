# aietes-js
A mock server for Rest requests

### Build Status
[![Build Status](https://travis-ci.com/dtobe/aietes-js.svg?token=vnspnEo4jpC1xxuzG92q&branch=master)](https://travis-ci.com/dtobe/aietes-js)


aietes-js is a Wiremock inspired Express-based integration test framework for JavaScript `REST` APIs. 


## Features

In simple terms, aietes-js allows you to setup mock server endpoints and configure

- Status code
- Headers
- JSON Response
- Lists of JSON Responses


## Getting Started
>To run aietes-js, you will need Node.js v10 or newer.

### Installation 
To install aietes-js, you may choose one of the following methods:

### npm
```sh
$ npm install aietes-js
```

### yarn
```sh
$ yarn install aietes-js
```

## Getting Started
### Import

```
const request = require("supertest");                                              // Test framework for rest calls
const getPort = require("get-port");                                               // Library for getting free ports
const MockServer = require("../../lib/mock-server");                               // The Aites Mockserver
const testServerConfig = require("../test-setup/test-server-config");              // Optional config for your test endpoints
const mockServerResponses = require("../test-setup/mock-data/price-above-5000");   // A JSON containing your mock responses
```

### Setup & Teardown
```
    beforeAll(async () => {
        randomPort = await getPort();
        testServerConfig.setup({server_port: randomPort });
        externalServiceMock = new MockServer(mockServerResponses, randomPort);
        externalServiceMock.start();
    });

    beforeEach(() => {
        server = require("../server");
    });

    afterEach(() => {
        server.close();
    });

    afterAll(() => {
        externalServiceMock.stop();
        testServerConfig.clear();
    });
```
### JSON format example
```
{                                        
 "/api/currentprice": {                                 // The URL of your mock service                                                       
   "get": {                                             // The request type                                                       
     "status": 200,                                     // The status you want the mock to return                                         
     "data": {                                          // Everything within data is the json the endpoint will return
       "time": {
         "updated": "Apr 15, 2019 11:57:00 UTC",
         "updatedISO": "2019-04-15T11:57:00+00:00",
         "updateduk": "Apr 15, 2019 at 12:57 BST"
       },
       "disclaimer": "This data was produced from the CoinDesk Bitcoin Price Index (USD). Non-USD currency data converted using hourly conversion rate from openexchangerates.org",
       "chartName": "Bitcoin",
       "bpi": {
         "USD": {
           "code": "USD",
           "symbol": "&#36;",
           "rate": "5,148.8200",
           "description": "United States Dollar",
           "rate_float": 5148.82
         }
       }
     }
   }
 }
}
```
### An example test

```
describe("Sample IT for the bitcoin service", () => {
    let server;
    let externalServiceMock;
    let randomPort;

    ...
    ...
    
    const callExternalService = () => {
        return request(server)
            .get("/ui")
    };

    it("should return 200 and display UP if Bitcoin price is above $5000", async () => {
        const res = await callExternalService();
        const responseMarkup = res.text;

        expect(res.status).toBe(200);
        expect(responseMarkup).toBeTruthy();
        expect(responseMarkup).toContain("{\"btcPrice\":{\"up\":\"5148.82\"}}");
    });
  });
```
## Examples
A complete example project including the above can be found in the `samples` directory of the project.

## Credits
Inspired by [Mock-Json-Server](https://www.npmjs.com/package/mock-json-server) and [Wiremock](http://wiremock.org)

## The name
Explanation of the name [Aietes](https://en.wikipedia.org/wiki/Ae%C3%ABtes#Jason_and_the_Argonauts)

