const express = require("express");
const _ = require("lodash");
const enableDestroy = require("server-destroy");
const morgan = require("morgan");

const methods = ["get", "post", "put", "delete"];
const isDebug = process.env.DEBUG || false;

const log = data => {
  if (!process.env.NO_OUTPUT) {
    console.log(data);
  }
};

class AietesServer {
  constructor(responses, port) {
    // clone responses object to avoid external changes to the reference
    this.responses = Object.assign({}, responses);
    this.responsesMetaData = {};
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
    Object.assign(this.responses, responses);
  }

  reset(responses) {
    console.log("Restarting Aietes server");
    this._end();
    this.responses = Object.assign({}, responses);
    this.responsesMetaData = {};
    this._setup();
    this.start();
  }

  stop() {
    console.log("Exiting Aietes server");
    this._end();
  }

  _setup() {
    this.app = express();
    this.app.use(morgan("tiny"));
    this.app.locals = {
      _: _
    };
    this._makeRoutes();
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
    _.each(this.responses, (value, path) => {
      _.each(value, (responseData, method) => {
        this._initMetaDataForPath(path, method);
        if (_.includes(methods, method)) {
          this.app[method](path, (req, res) => {
            const endPointResponse = this.responses[path][method];
            let currentResponse;
            if (Array.isArray(endPointResponse)) {
              const currentResponseIndex = this.responsesMetaData[path][method].currentResponse;
              currentResponse = endPointResponse[currentResponseIndex];
              this._nextResponse(path, method);
            } else {
              currentResponse = endPointResponse;
            }
            return this._sendResponse(res, currentResponse);
          });
        } else {
          console.warn(`Method ${method} is not supported. Path '${path}'-${method} will be skipped.`);
        }
      });
    });
  }

  _initMetaDataForPath(path, method) {
    if (!this.responsesMetaData[path]) {
      this.responsesMetaData[path] = {};
    }
    if (!this.responsesMetaData[path][method]) {
      this.responsesMetaData[path][method] = {};
    }
    this.responsesMetaData[path][method].currentResponse = 0;
  }

  _nextResponse(path, method) {
    const currentValue = this.responsesMetaData[path][method].currentResponse;
    const maxValue = this.responses[path][method].length;
    this.responsesMetaData[path][method].currentResponse = (currentValue + 1) % maxValue;
  }

  _sendResponse(res, responseData) {
    const returnStatus = responseData["status"] || 200;
    res
      .status(returnStatus)
      .set(responseData["headers"])
      .jsonp(responseData["data"]);
  }
}

module.exports = AietesServer;
