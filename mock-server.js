const express = require('express');
const _ = require('lodash');
const enableDestroy = require('server-destroy');
const unconfiguredRoutesHandler = require('./lib/errorHandler');
const MetaData = require('./lib/metaData');
const { log, accessLog } = require('./lib/logging');

const SUPPORTED_METHODS = ['get', 'post', 'put', 'delete'];

class AietesServer {
  constructor(responses, port) {
    // clone responses object to avoid external changes to the reference
    this.responses = Object.assign({}, responses);
    this.responsesMetaData = new MetaData();
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

  update(responses) {
    log.info('Updating responses');
    Object.assign(this.responses, responses);
  }

  reset(responses) {
    log.info('Restarting Aietes server');
    this._end();
    this.responses = Object.assign({}, responses);
    this.responsesMetaData.clear();
    this._setup();
    this.start();
  }

  stop() {
    log.info('Exiting Aietes server');
    this._end();
  }

  setDelayMs(delayMs, path, method) {
    this.responsesMetaData.setDelayMs(delayMs, path, method);
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
    _.each(this.responses, (responsesByMethod, path) => {
      Object.keys(responsesByMethod).forEach((method) => {
        const methodForExpress = method.toLowerCase();
        if (SUPPORTED_METHODS.includes(methodForExpress)) {
          this.responsesMetaData.initMetaDataForHandler(path, method);
          this.app[methodForExpress](path, this._createHandler(path, method));
        } else {
          log.warn(`Method ${method} is not supported. Path '${path}'-${method} will be skipped.`);
        }
      });
    });
  }

  _createHandler(path, method) {
    return async(req, res) => {
      logParameters(req);

      const endPointResponse = this.responses[path][method];
      let currentResponse;
      if (Array.isArray(endPointResponse)) {
        const responseIndex = this.responsesMetaData.nextResponseIndex(path, method, endPointResponse.length);
        currentResponse = endPointResponse[responseIndex];
      } else {
        currentResponse = endPointResponse;
      }
      const delayMs = this.responsesMetaData.getDelayMs(path, method);
      return createSendResponseCallback(res, currentResponse, delayMs)();
    };
  }
}

const logParameters = req => {
  let logMessage = '';
  if (req.params && Object.keys(req.params).length) {
    logMessage += `Path variables${buildParameterList(req.params)}\n`;
  }
  if (req.query && Object.keys(req.query).length) {
    logMessage += `Query parameters${buildParameterList(req.query)}`;
  }
  if (logMessage) {
    logMessage = `Request to ${req.path}\n` + logMessage;
    log.info(logMessage);
  }
};

const buildParameterList = params => {
  let paramList = '';
  Object.keys(params).forEach(key => {
    paramList += `\n- ${key}: ${params[key]}`;
  });
  return paramList;
};

const createSendResponseCallback = (handlerResponse, responseData, delayMs) => {
  return async() => {
    const returnStatus = responseData['status'] || 200;
    if (delayMs) {
      log.info(`Delaying response for ${delayMs}ms`);
      await setTimeout(() => {
        handlerResponse
          .status(returnStatus)
          .set(responseData['headers'])
          .jsonp(responseData['data']);
      }, delayMs);
    } else {
      log.info('Returning immediate response');
      handlerResponse
        .status(returnStatus)
        .set(responseData['headers'])
        .jsonp(responseData['data']);
    }
  };
};

module.exports = AietesServer;
