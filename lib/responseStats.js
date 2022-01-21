const _ = require('lodash')

class ResponseStats {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter
    this.stats = {}
  }

  listen() {
    this.eventEmitter.on('aietes-stats', (data) => {
      const { path, method } = data
      if (!this.stats[path]) {
        this.stats[path] = {}
      }
      if (!this.stats[path][method]) {
        this.stats[path][method] = {
          numCalls: 0
        }
      }
      this.stats[path][method].numCalls++
    })
  }

  clear() {
    Object.getOwnPropertyNames(this.stats).forEach(prop => {
      delete this.stats[prop] // must not re-assign the object reference
    })
  }

  timesCalled(pathMatcher, methodMatcher) {
    let matchingPathStats
    if (typeof pathMatcher === 'function') {
      matchingPathStats = _.filter(this.stats, (statsByMethod, path) => pathMatcher(path))
    } else {
      matchingPathStats = [this.stats[pathMatcher]]
    }

    let numCalls = 0
    const statList = _.flatMap(matchingPathStats, (statBlock) => {
      return _.filter(statBlock, (stats, method) => {
        if (Array.isArray(methodMatcher)) {
          return methodMatcher.map(value => value.toLowerCase()).includes(method)
        } else {
          return method === methodMatcher.toLowerCase()
        }
      })
        .map((stats) => {
          return stats.numCalls
        })
    })

    numCalls = _.reduce(statList, function(sum, n) {
      return sum + n
    }, 0)

    return numCalls
  }
}

module.exports = ResponseStats
