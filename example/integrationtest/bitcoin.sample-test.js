const request = require('supertest')
const getPort = require('get-port')
const MockServer = require('../../mock-server')
const testServerConfig = require('../test-setup/test-server-config')

const mockServerResponses = require('../test-setup/mock-data/price-above-5000')
const anotherMockServerResponse = require('../test-setup/mock-data/price-below-5000')

describe('Sample IT for the bitcoin service', () => {
  let server
  let externalServiceMock
  let randomPort

  beforeAll(async() => {
    randomPort = await getPort()
    testServerConfig.setup({ server_port: randomPort })
    externalServiceMock = new MockServer(mockServerResponses, randomPort)
    externalServiceMock.start()
  })

  beforeEach(() => {
    server = require('../server')
  })

  afterEach(() => {
    server.close()
    externalServiceMock.clearStats()
  })

  afterAll(() => {
    externalServiceMock.stop()
    testServerConfig.clear()
  })

  const callExternalService = () => {
    return request(server)
      .get('/example')
  }

  it('should return 200 and display UP if Bitcoin price is above $5000', async() => {
    const res = await callExternalService()
    const responseMarkup = res.text

    expect(res.status).toBe(200)
    expect(responseMarkup).toBeTruthy()
    expect(responseMarkup).toContain('{"btcPrice":{"up":"5148.82"}}')
    expect(externalServiceMock.timesCalled('/api/currentprice', 'get')).toBe(1)
  })

  it('should return 200 and display DOWN if Bitcoin price is below $5000', async() => {
    externalServiceMock.update(anotherMockServerResponse)

    const res = await callExternalService()
    const responseMarkup = res.text

    expect(res.status).toBe(200)
    expect(responseMarkup).toBeTruthy()
    expect(responseMarkup).toContain('{"btcPrice":{"down":"4148.82"}}')
    expect(externalServiceMock.timesCalled('/api/currentprice', 'get')).toBe(1)
  })
})
