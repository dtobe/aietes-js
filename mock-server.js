const express = require('express');
const _ = require('lodash');
const enableDestroy = require('server-destroy');
const unconfiguredRoutesHandler = require('./lib/errorHandler');
const ResponseConfig = require('./lib/response');
const { log, accessLog } = require('./lib/logging');

const SUPPORTED_METHODS = ['get', 'post', 'put', 'delete'];

class AietesServer {
  constructor(responsesConfig, port) {
    this.stats = {};
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
      const existingResponse = findResponse(this.responses, newResponse.path, newResponse.method);
      if (existingResponse) {
        existingResponse.update(newResponse.endPointResponse);
      }
    });
  }

  reset(responsesConfig) {
    log.info('Restarting Aietes server');
    this._end();
    this.stats = {};
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
      const existingResponse = findResponse(this.responses, path, method);
      existingResponse && existingResponse.setDelayMs(delayMs);
    }
  }

  timesCalled(pathMatcher, methodMatcher) {
    console.log(this.stats)
    let matchingPathStats;
    if (typeof pathMatcher === 'function') {
      matchingPathStats = this.stats.filter(pathMatcher);
    } else {
      matchingPathStats = [this.stats[pathMatcher]];
    }
    console.error(matchingPathStats)

    let numCalls = 0;
    if (matchingPathStats) {
      const statList = _.flatMap(matchingPathStats, (statBlock) => {
        console.log(statBlock)
        return _.filter(statBlock, (stats, method) => {
          console.log(method)
          if (Array.isArray(methodMatcher)) {
            return methodMatcher.map(value => value.toLowerCase()).contains(method);
          } else {
            return method === methodMatcher.toLowerCase();
          }
        })
        .map((stats) => {
          console.warn(stats)
          return stats.numCalls;
        })
      })
      console.log(statList)
      numCalls = _.reduce(statList, function(sum, n) {
        return sum + n;
      }, 0);
    }

    return numCalls;
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
      this.app[response.method](response.path, response.createHandler(this.stats));
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

const findResponse = (responses, path, method) => {
  const normalizedMethod = method.toLowerCase();
  return responses.find((savedResponse) => {
    return savedResponse.path === path && savedResponse.method === normalizedMethod;
  });
};

module.exports = AietesServer;
