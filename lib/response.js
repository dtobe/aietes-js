const { log } = require('./logging')

class ResponseConfig {
  constructor(path, method, responses) {
    this.path = path
    this.method = method
    this.update(responses)
  }

  update(responses) {
    // clone responses object to avoid external changes to the reference
    this.endPointResponse = Array.isArray(responses) ? [...responses] : { ...responses }
    this.responsesMetaData = {
      currentResIndex: 0,
      requestDelayMs: null
    }
  }

  setDelayMs(delayMs = null) {
    this.responsesMetaData.requestDelayMs = delayMs
  }

  createHandler(stats) {
    return async(req, res) => {
      logParameters(req)

      let currentResponse
      if (Array.isArray(this.endPointResponse)) {
        currentResponse = this.endPointResponse[this._nextResponseIndex()]
      } else {
        currentResponse = this.endPointResponse
      }
      updateStats(stats, req.path, this.method)
      return createSendResponseCallback(req, res, currentResponse, this.responsesMetaData.requestDelayMs)()
    }
  }

  _nextResponseIndex() {
    const metaData = this.responsesMetaData
    const currentValue = metaData.currentResIndex
    log.info(`${this.method} ${this.path} - returning response [${currentValue}]`)
    metaData.currentResIndex = (metaData.currentResIndex + 1) % this.endPointResponse.length
    return currentValue
  }
}

const updateStats = (stats, path, method) => {
  if (!stats[path]) {
    stats[path] = {}
  }
  if (!stats[path][method]) {
    stats[path][method] = {
      numCalls: 0
    }
  }
  stats[path][method].numCalls++
}

const logParameters = req => {
  let logMessage = ''
  if (req.params && Object.keys(req.params).length) {
    logMessage += `Path variables${buildParameterList(req.params)}\n`
  }
  if (req.query && Object.keys(req.query).length) {
    logMessage += `Query parameters${buildParameterList(req.query)}`
  }
  if (logMessage) {
    logMessage = `Request to ${req.path}\n` + logMessage
    log.info(logMessage)
  }
}

const buildParameterList = params => {
  let paramList = ''
  Object.keys(params).forEach(key => {
    paramList += `\n- ${key}: ${params[key]}`
  })
  return paramList
}

const createSendResponseCallback = (handlerRequest, handlerResponse, responseData, globalDelayMs) => {
  return async() => {
    const returnStatus = responseData.status || 200
    const configDelayMs = responseData.meta && responseData.meta.delayMs
    const delayMs = typeof globalDelayMs === 'number' ? globalDelayMs : configDelayMs
    if (delayMs) {
      log.info(`${handlerRequest.method} ${handlerRequest.path} - delaying response for ${delayMs}ms`)
      await setTimeout(() => {
        handlerResponse
          .status(returnStatus)
          .set(responseData.headers)
          .jsonp(responseData.data)
      }, delayMs)
    } else {
      log.info(`${handlerRequest.method} ${handlerRequest.path} - returning immediate response`)
      handlerResponse
        .status(returnStatus)
        .set(responseData.headers)
        .jsonp(responseData.data)
    }
  }
}

module.exports = ResponseConfig
