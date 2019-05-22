# aietes-js
Express.js-based mock server for RESTful APIs inspired by Wiremock.

[![Build Status](https://travis-ci.com/dtobe/aietes-js.svg?token=vnspnEo4jpC1xxuzG92q&branch=master)](https://travis-ci.com/dtobe/aietes-js)

## Features

- Set up mock response per HTTP method and route/resource path
- For each mock response define
    - Status code
    - Response headers
    - JSON body
- Set up lists of responses

## Installation 
To run aietes-js [Node.js](https://nodejs.org/en/download/) v10 or newer is required.

Install Aietes-js using your preferred dependency manager:

#### npm
```bash
$ npm install aietes-js
```

#### yarn
```bash
$ yarn install aietes-js
```
or
```bash
$ yarn add aietes-js
```

## Getting Started

### Programmatic Usage

### Setup & Teardown
Example usage in Jest style tests.
```javascript
    let mockServer;

    // instantiate the mock server with config and a free port to run on and start it
    beforeAll(() => {
        mockServer = new AietesServer(defaultResponseConfiguration, someFreePort);
        mockServer.start();
    });
    
    // optionally reload your config after each test case without restarting the server
    afterEach(() => {
        mockServer.update(defaultResponseConfiguration);
    });

    // stop and destroy the mock server instance
    afterAll(() => {
        mockServer.stop();
    });
    
    // ...
    
    // update (some or all) existing endpoints with new response definitions
    // endpoints missing in this config are not altered
    it('some test case', async () => {
        mockServer.update(partialCustomResponseConfiguration);
        // ...
    });
```
**Caution:** You can also reset the server. This means that the mock server instance is stopped, torn down and restarted with new routes and response configuration. All previously defined routes and responses are dropped!
```javascript
    mockServer.reset(newRoutesAndResponseConfiguration);
```

### Response configuration
The response configuration object that needs to be passed to the AietesServer constructor, broken down here for clarity.
```javascript
{
    "/endpoint1": {
        // currently supported HTTP methods
        get: someResponseObject,
        post: someResponseObject,
        delete: someResponseObject,
        put: someResponseObject
    },
    "/endpoint2": {
        // empty response, default status is 200
        get: {}
    },
    "/endpoint3": {
        // list of responses
        get: [
            someResponseObject,
            someResponseObject2
        ]
    }
}
```
Format of an individual repsonse object.
```javascript
{
    status: 201,
    headers: { 
        "some-header": "header-value"
    },
    data: {
        "field1": 1, 
        "field2": "value",
        "field3": false
    }
}
```


### Simulating delay or lag
A delay in mock request processing can be set to simulate network lag or long running operations.
This can be done per route and method or globally.
#### Global delay
Setting the delay in milliseconds:
```javascript
mockServer.setDelayMs(200);
```
Resetting the delay:
```javascript
mockServer.setDelayMs(0);
```
#### Per route and method delay
Setting the delay in milliseconds:
```javascript
mockServer.setDelayMs(200, "/endpoint1", "get");
```
Resetting the delay:
```javascript
mockServer.setDelayMs(0, "/endpoint1", "get");
```

## Examples
A complete example project including the above can be found in the `samples` directory of the project.

## Contact
[Issues, bugs and feature requests](https://github.com/dtobe/aietes-js/projects/1)

## Contributing
[How to contribute](CONTRIBUTING.md)

## Credits
Inspired by [Mock-Json-Server](https://www.npmjs.com/package/mock-json-server) and [Wiremock](http://wiremock.org)

## The name
Aietes (or one of the official English spellings, "Aeëtes", "Aeeta", or "Æëtes") was the king of Colchis in the myth of Jason and the Argonauts. He subjected Jason, who had come for the golden fleece, to several wicked tests (and may have mocked him in the process). See Wikipedia on [Aietes](https://en.wikipedia.org/wiki/Ae%C3%ABtes#Jason_and_the_Argonauts) and [Jason in Colchis](https://en.wikipedia.org/wiki/Jason#The_arrival_in_Colchis).

## License

  [MIT](LICENSE)
