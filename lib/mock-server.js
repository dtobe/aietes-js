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
    this.responses = responses;
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
    this.app.use(_handleUnconfiguredRoutes);
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
        if (_.includes(methods, method)) {
          this.app[method](path, (req, res) => {
            const endPointResponse = this.responses[path][method];
            const returnStatus = endPointResponse["status"] || 200;
            res
              .status(returnStatus)
              .set(endPointResponse["headers"])
              .jsonp(endPointResponse["data"]);
          });
        } else {
          console.warn(
            `Method ${method} is not supported. Path '${path}'-${method} will be skipped.`
          );
        }
      });
    });
  }
}

const _handleUnconfiguredRoutes = (req, res) => {
  console.warn("Unconfigured route called.")
  res.status(404)
  res.json({
    error: {
      message: "The route was not configured!",
    },
  })
};

module.exports = AietesServer;
