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
> Import & setup

```
const request = require("supertest");
const getPort = require("get-port");
const MockServer = require("../../lib/mock-server");
const testServerConfig = require("../test-setup/test-server-config");
const mockServerResponses = require("../test-setup/mock-data/price-above-5000");
```
> The json format
```
{
     "/api/currentprice": {         // The URL of your mock service
       "get": {                     // The request type
         "status": 200,             // The status you want the mock to return
         "data": {                  // Everything within data is the json the endpoint will return
           "sampleData": "fooBar"
         }
       }
     }
   }
   
```
> Setup & Teardown
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
> An example test

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

