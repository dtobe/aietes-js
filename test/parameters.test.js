const request = require('supertest')
const AietesServer = require('../mock-server')
const getPort = require('get-port')

describe('Aietes Server path matching IT', () => {
  let mockServer
  const responseObject = {
    data: { field1: 1, field2: 'value' }
  }

  beforeAll(async() => {
    mockServer = new AietesServer(
      {
        '/endpoint1/:pathVariable': {
          get: responseObject
        },
        '/endpoint1/': {
          get: {
            status: 201
          }
        },
        '/endpoint2(/*)?': {
          get: {}
        },
        '/endpoint3/*': {
          get: {}
        }
      },
      await getPort()
    )

    mockServer.start()
  })

  afterAll(() => {
    mockServer.stop()
  })

  it('should allow path variables in mock config and match the correct route', async() => {
    const response = await request(mockServer.server).get('/endpoint1/pathValue')
    expect(response.status).toEqual(200)
    expect(response.body).toMatchObject({ field1: 1, field2: 'value' })
  })

  it('should require path variables to match in number', async() => {
    const response = await request(mockServer.server).get('/endpoint1/pathValue/otherValue123')
    expect(response.status).toEqual(404)
  })

  it('should ignore query parameters in path matching', async() => {
    const response = await request(mockServer.server).get('/endpoint1/pathValue?queryParam=queryValue')
    expect(response.status).toEqual(200)
    expect(response.body).toMatchObject({ field1: 1, field2: 'value' })
  })

  it.each([
    '/endpoint2', '/endpoint2/pathValue', '/endpoint2/pathValue1/pathValue2'
  ])('should recognise wildcard expression in a route and match all paths %s', async(path) => {
    const response = await request(mockServer.server).get(path)
    expect(response.status).toEqual(200)
  })

  it.each([
    '/endpoint3/pathValue', '/endpoint3/pathValue1/pathValue2'
  ])('should recognise simple wildcard * in a route and match all paths %s', async(path) => {
    const response = await request(mockServer.server).get(path)
    expect(response.status).toEqual(200)
  })
})
