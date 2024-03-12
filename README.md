# aietes-js
Express.js-based mock server for RESTful APIs inspired by Wiremock.

[![Npm](https://img.shields.io/npm/v/aietes-js.svg)](https://www.npmjs.com/package/aietes-js)
![Node LTS](https://img.shields.io/node/v-lts/aietes-js)
[![Build Status](https://github.com/dtobe/aietes-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/dtobe/aietes-js/actions/workflows/node.js.yml) 
[![Coverage Status](https://coveralls.io/repos/github/dtobe/aietes-js/badge.svg?branch=master)](https://coveralls.io/github/dtobe/aietes-js?branch=master) 
[![Join the chat at https://gitter.im/aietes-js/community](https://badges.gitter.im/aietes-js/community.svg)](https://gitter.im/aietes-js/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Features

- Set up mock response per HTTP method and route/resource path
- For each mock response define
    - Status code
    - Response headers
    - JSON body
- Set up lists of responses
- Set a request delay (e.g. to simulate lag)
- Query number of calls for assertions

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

### Standalone Usage
To run aietes-js as a standalone application run the following command
```bash
$ yarn run start
```
Optional command-line arguments

`--port=4321`  Start the server on the given port if it is free, a random free port otherwise.

`--json=response.json`  Absolute or relative path to a response definition file (see below)

### Standalone Docker container
The project includes a Dockerfile to create an image with a single Aietes instance. To build the image run:
```bash
$ docker build .
```
You can optionally set your preferred port to expose and start Aietes on. The default port is 8080.
```bash
$ docker build  --build-arg container_port=<port> .
```
When starting the container, map the exposed port to a port on the host.
```bash
$ docker run -p <host port>:<exposed port> <container id from build>
```

### Programmatic Usage

#### Setup & Teardown
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

#### Response configuration
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
NB some simple wildcard expressions are possible in route names (since the underlying ExpressJs server allows it).
```javascript
{
    // matches all paths /endpoint1, /endpoint1/pathVariable, etc.
    "/endpoint1(/*)?": {
        // ...
    },
    // matches all paths /endpoint2/pathVariable, etc.
    "/endpoint2/*": {
        // ...
    }
}
```
Format of an individual response object.
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


#### Simulating delay or lag
A delay in mock request processing can be set to simulate network lag or long running operations.
This can be done per route and method or globally.

##### Global delay
Setting the delay in milliseconds:
```javascript
mockServer.setDelayMs(200);
```
Resetting the delay:
```javascript
mockServer.setDelayMs(0);
```
or
```javascript
mockServer.setDelayMs();
```
##### Per route and method delay
Setting the delay in milliseconds:
```javascript
mockServer.setDelayMs(200, "/endpoint1", "get");
```
Resetting the delay:
```javascript
mockServer.setDelayMs(null, "/endpoint1", "get");
```

##### Including the delay in the response config
This will _only_ take effect for this request/response pair, meaning if it is part of a list of responses the delay will only be applied to the response with `meta` block.

A delay configured in this way can be overridden by using one of the above calls to set a global or per-route delay.
```javascript
{
    status: ...,
    headers: ...,
    data: ...,
    meta: {
      delayMs: 200
    }
}
```

#### Assertions
##### Call count
To facilitate assertions the Aietes server instance offers an API to query the number of calls to the combination of endpoint and HTTP method.
In its simplest form the query takes two string arguments:
```javascript
mockServer.timesCalled('/endpoint1/', 'get')
```
* Note: Even though NodeJs routes are by default not case-sensitive and ignore the trailing '/', this is *not* true of the Aietes server.  
i.E. `mockServer.timesCalled('/endpoint1/', 'get')` != `mockServer.timesCalled('/endpoint1', 'get')`  
and `mockServer.timesCalled('/ENDpoint1/', 'get')` != `mockServer.timesCalled('/endPOINT1/', 'get')`  

The first argument may also be a single-argument predicate to filter by:
```javascript
mockServer.timesCalled(path => { return path.startsWith('/endpoint'); }, 'get')
```
The second argument may also be a list of HTTP methods:
```javascript
mockServer.timesCalled('/endpoint1/', ['get', 'post'])
```

##### Query parameters
The Aietes server instances also offers an API call to obtain the query parameters passed to the mock on a per call basis.
The matching of calls is stricter since parameters can only apply to a single call, so only the exact strings for path and method are allowed.
Assuming a call to the mock endpoint such as
```
GET /endpoint1/?param1=foo&param2=bar&param3=42
```
a call to
```javascript
mockServer.queryParameters('/endpoint1/', 'get')
```
will return a list of objects with the single element
```
{ param1: 'foo', param2: 'bar', param3: '42' }
```
Objects for further calls are appended to this list.

##### Clearing stats
To clear the call stats:
```javascript
mockServer.clearStats()
```
* Note: stats are also cleared when the response config is reset. They are left unchanged on update.

## Examples
A complete example project including the above can be found in the `/example` directory of the project.

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
