const express = require("express");
const _ = require("lodash");
const enableDestroy = require("server-destroy");
const morgan = require("morgan");
const unconfiguredRoutesHandler = require('./lib/errorHandler');
const MetaData = require('./lib/metaData');

const SUPPORTED_METHODS = ["get", "post", "put", "delete"];
const isDebug = process.env.DEBUG || false;

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
        log(`Aietes server running at http://localhost:${this.serverPort}/`);
        return true;
      });
    } catch (e) {
      log("Could not start Aietes server.");
      if (isDebug) {
        log(e);
      }
      process.exit(1);
    }
  }

  update(responses) {
    log('Updating responses');
    Object.assign(this.responses, responses);
  }

  reset(responses) {
    log("Restarting Aietes server");
    this._end();
    this.responses = Object.assign({}, responses);
    this.responsesMetaData.clear();
    this._setup();
    this.start();
  }

  stop() {
    log("Exiting Aietes server");
    this._end();
  }

  setDelay(delayMs, path, method) {
    this.responsesMetaData.setDelay(delayMs, path, method);
  }

  _setup() {
    this.app = express();
    this.app.use(morgan("tiny"));
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
          console.warn(`Method ${method} is not supported. Path '${path}'-${method} will be skipped.`);
        }
      });
    });
  }

  _createHandler(path, method) {
    return async (req, res) => {
      const endPointResponse = this.responses[path][method];
      let currentResponse;
      if (Array.isArray(endPointResponse)) {
        const responseIndex = this.responsesMetaData.nextResponseIndex(path, method, endPointResponse.length);
        currentResponse = endPointResponse[responseIndex];
      } else {
        currentResponse = endPointResponse;
      }
      const delay = this.responsesMetaData.getDelay(path, method);
      return createSendResponseCallback(res, currentResponse, delay)();
    }
  }
}

const createSendResponseCallback = (handlerResponse, responseData, delay) => {
  return async () => {
    const returnStatus = responseData["status"] || 200;
    if (delay) {
      log(`Delaying response for ${delay}ms`);
      await setTimeout(() => {
        handlerResponse
          .status(returnStatus)
          .set(responseData["headers"])
          .jsonp(responseData["data"]);
      }, delay);
    } else {
      log('Returning immediate response');
      handlerResponse
        .status(returnStatus)
        .set(responseData["headers"])
        .jsonp(responseData["data"]);
    }
  }
}

const log = data => {
  if (!process.env.NO_OUTPUT) {
    console.log(data);
  }
};

module.exports = AietesServer;
