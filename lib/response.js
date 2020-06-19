const { log } = require('./logging');

class ResponseConfig {
  constructor(path, method, responses) {
    this.path = path;
    this.method = method;
    this.update(responses);
  }

  update(responses) {
    // clone responses object to avoid external changes to the reference
    this.endPointResponse = Array.isArray(responses) ? [...responses] : { ...responses };
    this.responsesMetaData = {
      currentResIndex: 0,
      requestDelayMs: 0
    };
  }

  setDelayMs(delayMs) {
    this.responsesMetaData.requestDelayMs = delayMs;
  }

  createHandler(stats) {
    return async(req, res) => {
      logParameters(req);

      let currentResponse;
      if (Array.isArray(this.endPointResponse)) {
        currentResponse = this.endPointResponse[this._nextResponseIndex()];
      } else {
        currentResponse = this.endPointResponse;
      }
      updateStats(stats, req.path, this.method);
      return createSendResponseCallback(res, currentResponse, this.responsesMetaData.requestDelayMs)();
    };
  }

  _nextResponseIndex() {
    const metaData = this.responsesMetaData;
    const currentValue = metaData.currentResIndex;
    log.info(`returning response [${currentValue}] for handler ${this.method} ${this.path}`);
    metaData.currentResIndex = (metaData.currentResIndex + 1) % this.endPointResponse.length;
    return currentValue;
  }
}

const updateStats = (stats, path, method) => {
  if (!stats[path]) {
    stats[path] = {};
  }
  if (!stats[path][method]) {
    stats[path][method] = {
      numCalls: 0
    };
  }
  stats[path][method].numCalls++;
};

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

module.exports = ResponseConfig;
