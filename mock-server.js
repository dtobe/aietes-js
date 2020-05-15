const express = require('express');
const _ = require('lodash');
const enableDestroy = require('server-destroy');
const unconfiguredRoutesHandler = require('./lib/errorHandler');
const ResponseConfig = require('./lib/response');
const { log, accessLog } = require('./lib/logging');

const SUPPORTED_METHODS = ['get', 'post', 'put', 'delete'];

class AietesServer {
  constructor(responsesConfig, port) {
    this.responses = createResponses(responsesConfig);
    this.serverPort = port;
    this.app = null;
    this.server = null;
    this._setup();
  }

  start() {
    try {
      this._listen(() => {
        log.info(`Aietes server running at http://localhost:${this.serverPort}/`);
        return true;
      });
    } catch (e) {
      log.error('Could not start Aietes server.');
      log.error(e);
      process.exit(1);
    }
  }

  update(responsesConfig) {
    log.info('Updating responses');
    const newResponses = createResponses(responsesConfig);
    newResponses.forEach((newResponse) => {
      const existingResponse = this.responses.find((savedResponse) => {
        return savedResponse.path === newResponse.path && savedResponse.method === newResponse.method;
      });
      if (existingResponse) {
        existingResponse.update(newResponse.endPointResponse);
      }
    });
  }

  reset(responsesConfig) {
    log.info('Restarting Aietes server');
    this._end();
    this.responses = createResponses(responsesConfig);
    this._setup();
    this.start();
  }

  stop() {
    log.info('Exiting Aietes server');
    this._end();
  }

  setDelayMs(delayMs, path, method) {
    if (!(path && method)) {
      this.responses.forEach((response) => {
        response.setDelayMs(delayMs);
      });
    } else {
      const existingResponse = this.responses.find((savedResponse) => {
        return savedResponse.path === path && savedResponse.method === method;
      });
      existingResponse && existingResponse.setDelayMs(delayMs);
    }
  }

  _setup() {
    this.app = express();
    this.app.use(accessLog);
    this.app.locals = {
      _: _
    };
    this._makeRoutes();
    this.app.use(unconfiguredRoutesHandler);
  }

  _listen(callback) {
    this.server = this.app.listen(this.serverPort, () => {
      callback();
    });
    enableDestroy(this.server);
  }

  _end() {
    this.server.destroy();
  }

  _makeRoutes() {
    this.responses.forEach((response) => {
      this.app[response.method](response.path, response.createHandler());
    });
  }
}

const createResponses = (responsesConfig) => {
  return _.flatMap(responsesConfig, (responsesByMethod, path) => {
    return _.map(responsesByMethod, (responses, method) => {
      const methodForExpress = method.toLowerCase();
      if (SUPPORTED_METHODS.includes(methodForExpress)) {
        return new ResponseConfig(path, methodForExpress, responses);
      } else {
        log.warn(`Method ${method} is not supported. Path '${path}'-${method} will be skipped.`);
      }
    });
  }).filter(response => {
    return response !== undefined;
  });
};

module.exports = AietesServer;
