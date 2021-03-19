const getPort = require('get-port')
const argv = require('yargs').argv
const fs = require('fs')
const { log } = require('../lib/logging')

const AietesServer = require('../mock-server')

const standalone = async() => {
  log.info('Starting Aietes standalone')

  const port = argv.port || await getPort()

  const responseFileName = argv.json
  let jsonResponse
  if (responseFileName) {
    try {
      jsonResponse = JSON.parse(fs.readFileSync(responseFileName, 'utf8'))
    } catch (err) {
      log.error(err.message)
      log.error(`Reading response definition file '${responseFileName}' failed. Aietes exiting.`)
      process.exit(1)
    }
  }
  const response = jsonResponse || {
    '/': {
      get: {
        status: 200,
        headers: {},
        data: { hello: 'Aietes' }
      }
    }
  }

  const standaloneMock = new AietesServer(response, port)
  standaloneMock.start()
}

module.exports = standalone()
