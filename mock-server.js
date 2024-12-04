const express = require('express')
const EventEmitter = require('events')
const _ = require('lodash')
const enableDestroy = require('server-destroy')
const unconfiguredRoutesHandler = require('./lib/errorHandler')
const validateResponses = require('./lib/configValidator')
const ResponseConfig = require('./lib/response')
const ResponseStats = require('./lib/responseStats')
const { log, accessLog } = require('./lib/logging')

class AietesServer {
  constructor(responsesConfig, port) {
    this.eventEmitter = new EventEmitter()
    this.stats = new ResponseStats(this.eventEmitter)
    this.responses = createResponses(responsesConfig)
    this.serverPort = port
    this.app = null
    this.server = null
    this._setup()
  }

  start() {
    try {
      this._listen(() => {
        log.info(`Aietes server running at http://localhost:${this.serverPort}/`)
        return true
      })
    } catch (e) {
      log.error('Could not start Aietes server.')
      log.error(e)
      process.exit(1)
    }
  }

  update(responsesConfig) {
    log.info('Updating responses')
    const newResponses = createResponses(responsesConfig)
    newResponses.forEach((newResponse) => {
      const existingResponse = findResponse(this.responses, newResponse.path, newResponse.method)
      if (existingResponse) {
        existingResponse.update(newResponse.endPointResponse)
      }
    })
  }

  reset(responsesConfig) {
    log.info('Restarting Aietes server')
    this._end()
    this.stats = new ResponseStats(this.eventEmitter)
    this.responses = createResponses(responsesConfig)
    this._setup()
    this.start()
  }

  clearStats() {
    this.stats.clear()
  }

  stop() {
    log.info('Exiting Aietes server')
    this._end()
  }

  setDelayMs(delayMs = null, path = undefined, method = undefined) {
    if (!(path && method)) {
      this.responses.forEach((response) => {
        response.setDelayMs(delayMs)
      })
    } else {
      const existingResponse = findResponse(this.responses, path, method)
      existingResponse && existingResponse.setDelayMs(delayMs)
    }
  }

  timesCalled(pathMatcher, methodMatcher) {
    return this.stats.timesCalled(pathMatcher, methodMatcher)
  }

  queryParameters(path, method) {
    return this.stats.queryParameters(path, method)
  }

  headers(path, method) {
    return this.stats.headers(path, method)
  }

  _setup() {
    this.app = express()
    this.app.use(accessLog)
    this.app.locals = {
      _: _
    }
    this._makeRoutes()
    this.stats.listen()
    this.app.use(unconfiguredRoutesHandler)
  }

  _listen(callback) {
    this.server = this.app.listen(this.serverPort, () => {
      callback()
    })
    enableDestroy(this.server)
  }

  _end() {
    this.server.destroy()
  }

  _makeRoutes() {
    this.responses.forEach((response) => {
      log.info(`Creating route handler for ${response.method} ${response.path}`)
      this.app[response.method](response.path, response.createHandler(this.eventEmitter))
    })
  }
}

const createResponses = (responsesConfig) => {
  return _.flatMap(responsesConfig, (responsesByMethod, path) => {
    return _.map(responsesByMethod, (responses, method) => {
      const methodForExpress = method.toLowerCase()
      try {
        validateResponses(responses, path, methodForExpress)
        return new ResponseConfig(path, methodForExpress, responses)
      } catch (error) {
        log.warn(`${error.message} ${methodForExpress}::${path} skipped`)
      }
    })
  }).filter(response => {
    return response !== undefined
  })
}

const findResponse = (responses, path, method) => {
  const normalizedMethod = method.toLowerCase()
  return responses.find((savedResponse) => {
    return savedResponse.path === path && savedResponse.method === normalizedMethod
  })
}

module.exports = AietesServer
