const request = require('supertest')
const AietesServer = require('../mock-server')
const getPort = require('get-port')

describe('Aietes Server Timeout IT', () => {
  let mockServer
  const responseObject = {
    headers: { 'some-header': 'header value' },
    data: { field1: 1, field2: 'value' }
  }

  beforeAll(async() => {
    mockServer = new AietesServer(
      {
        '/endpoint1': {
          get: responseObject
        },
        '/endpoint2': {
          get: [{
            ...responseObject,
            meta: {
              delayMs: 200
            }
          },
          {
            ...responseObject
          }]
        }
      },
      await getPort()
    )

    mockServer.start()
  })

  afterAll(() => {
    mockServer.stop()
  })

  afterEach(() => {
    mockServer.setDelayMs()
    mockServer.setDelayMs(null, '/endpoint1', 'get')
  })

  it('should allow configuring delay globally', async(done) => {
    mockServer.setDelayMs(200)
    try {
      await request(mockServer.server).get('/endpoint1').timeout(190)
      done.fail('Request did not time out')
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED')
      done()
    }
  })

  it('should allow configuring delay per endpoint', async(done) => {
    mockServer.setDelayMs(200, '/endpoint1', 'get')
    try {
      await request(mockServer.server).get('/endpoint1').timeout(190)
      done.fail('Request did not time out')
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED')
      done()
    }
  })

  it('should read delay per request from the config', async(done) => {
    // first request for route has a configured timeout
    try {
      await request(mockServer.server).get('/endpoint2').timeout(190)
      done.fail('Request did not time out')
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED')
    }

    // second request for route has no timeout
    const res = await request(mockServer.server).get('/endpoint2').timeout(50)
    expect(res.status).toBe(200)

    done()
  })

  it('should override delay read from the config with delay set programmatically', async(done) => {
    // override configured delay extending it by 100ms
    mockServer.setDelayMs(300, '/endpoint2', 'get')
    try {
      await request(mockServer.server).get('/endpoint2').timeout(290)
      done.fail('1st request did not time out')
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED')
    }

    // second request now also times out
    try {
      await request(mockServer.server).get('/endpoint2').timeout(290)
      done.fail('2nd request did not time out')
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED')
    }

    done()
  })

  it('should override delay read from the config with delay set programmatically', async(done) => {
    // override configured delay to remove it
    mockServer.setDelayMs(0, '/endpoint2', 'get')
    const res = await request(mockServer.server).get('/endpoint2').timeout(50)
    expect(res.status).toBe(200)

    // second request
    await request(mockServer.server).get('/endpoint2')
    done()
  })

  it('should reset the global delay correctly', async(done) => {
    mockServer.setDelayMs(500)
    try {
      await request(mockServer.server).get('/endpoint1').timeout(100)
      done.fail('Request did not time out')
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED')
    }

    mockServer.setDelayMs()
    const res = await request(mockServer.server).get('/endpoint1').timeout(100)
    expect(res.status).toBe(200)

    done()
  })

  it('should reset the per endpoint delay correctly', async(done) => {
    mockServer.setDelayMs(500, '/endpoint1', 'get')
    try {
      await request(mockServer.server).get('/endpoint1').timeout(100)
      done.fail('Request did not time out')
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED')
    }

    mockServer.setDelayMs(null, '/endpoint1', 'get')
    const res = await request(mockServer.server).get('/endpoint1').timeout(100)
    expect(res.status).toBe(200)

    done()
  })
})
