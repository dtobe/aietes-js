const request = require("supertest");
const AietesServer = require("../lib/mock-server");
const getPort = require("get-port");

describe("AietesServer IT", () => {
  let mockServer;
  const responseObject = {
    status: 201,
    headers: { "some-header": "hasenase" },
    data: { field1: 1, field2: "value" }
  };
  const responseObject2 = {
    status: 400,
    headers: {
      "some-header": "hasenase",
      "some-other-header": "someValue"
     },
    data: { field1: 1 }
  };

  beforeAll(async () => {
    mockServer = new AietesServer(
      {
        "/endpoint1": {
          get: responseObject,
          post: responseObject,
          delete: responseObject,
          put: responseObject,
          patch: responseObject
        },
        "/endpoint2": {
          get: {}
        },
        "/endpoint3": {
          get: [
            responseObject,
            responseObject2
          ]
        }
      },
      await getPort()
    );

    mockServer.start();
  });

  afterAll(() => {
    mockServer.stop();
  });

  it("response has all the values set on the mock for a get", async () => {
    const res = await request(mockServer.server).get("/endpoint1");
    expect(res.status).toBe(201);
    expect(res.header["some-header"]).toEqual("hasenase");
    expect(res.body).toMatchObject({ field1: 1, field2: "value" });
  });

  it("response has all the values set on the mock for a post", async () => {
    const res = await request(mockServer.server).post("/endpoint1");
    expect(res.status).toBe(201);
    expect(res.header["some-header"]).toEqual("hasenase");
    expect(res.body).toMatchObject({ field1: 1, field2: "value" });
  });

  it("response has all the values set on the mock for a delete", async () => {
    const res = await request(mockServer.server).delete("/endpoint1");
    expect(res.status).toBe(201);
    expect(res.header["some-header"]).toEqual("hasenase");
    expect(res.body).toMatchObject({ field1: 1, field2: "value" });
  });

  it("response has all the values set on the mock for a put", async () => {
    const res = await request(mockServer.server).put("/endpoint1");
    expect(res.status).toBe(201);
    expect(res.header["some-header"]).toEqual("hasenase");
    expect(res.body).toMatchObject({ field1: 1, field2: "value" });
  });

  it("should return responses in a list in a round robin fashion", async () => {
    let res = await request(mockServer.server).get("/endpoint3");
    expect(res.status).toBe(201);
    expect(res.header["some-header"]).toEqual("hasenase");
    expect(res.body).toMatchObject({ field1: 1, field2: "value" });

    res = await request(mockServer.server).get("/endpoint3");
    expect(res.status).toBe(400);
    expect(res.header["some-header"]).toEqual("hasenase");
    expect(res.header["some-other-header"]).toEqual("someValue");
    expect(res.body).toMatchObject({ field1: 1 });

    res = await request(mockServer.server).get("/endpoint3");
    expect(res.status).toBe(201);
    expect(res.header["some-header"]).toEqual("hasenase");
    expect(res.body).toMatchObject({ field1: 1, field2: "value" });
  });

  it("mock responds with 404 for unsuppored operation (e.g. PATCH)", async () => {
    const res = await request(mockServer.server).patch("/endpoint1");
    expect(res.status).toBe(404);
  });

  it("response has the default for status and all other values are optional", async () => {
    const res = await request(mockServer.server).get("/endpoint2");
    expect(res.status).toBe(200);
    expect(res.body).toBeFalsy();
  });

  it("should update return updated responses after call to update", async () => {
    mockServer.update({
      "/endpoint2": {
        get: {
          status: 401,
          headers: {
            header1: "headerValue1"
          },
          data: {
            field1: "value1",
            field2: "value2",
            field3: false
          }
        }
      }
    });

    const res = await request(mockServer.server).get("/endpoint2");

    expect(res.status).toBe(401);
    expect(res.header["header1"]).toEqual("headerValue1");
    expect(res.body).toMatchObject({
      field1: "value1",
      field2: "value2",
      field3: false
    });
  });

  it("should allow to update from single response to list of responses", async () => {
    mockServer.update({
      "/endpoint2": {
        get: [
          {
            status: 401
          },
          {
            status: 200
          }
        ]
      }
    });

    let res = await request(mockServer.server).get("/endpoint2");

    expect(res.status).toBe(401);

    res = await request(mockServer.server).get("/endpoint2");

    expect(res.status).toBe(200);
  });

  it("should not create new routes when update is called", async () => {
    mockServer.update({
      "/endpoint4": {
        get: {
          status: 200,
        }
      }
    });

    const res = await request(mockServer.server).get("/endpoint4");

    expect(res.status).toBe(404);
  });

  it("should correctly update mock endpoints and restart the server", async () => {
    mockServer.reset({
      "/new-endpoint": {
        get: {
          status: 200,
          data: {
            field1: "success"
          }
        }
      }
    });

    let res = await request(mockServer.server).get("/new-endpoint");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ field1: "success" });

    // previously configured endpoints are lost on reset
    res = await request(mockServer.server).get("/endpoint1");
    
    expect(res.status).toBe(404);
  });
});
