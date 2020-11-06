var Ajv = require('ajv');

const SUPPORTED_METHODS = ['get', 'post', 'put', 'delete', 'patch'];

const responseSchema = {
  '$id': 'Response.json',
  'resposeDef': {
    'type': 'object',
    'properties': {
      'status': {
        'type': 'integer'
      },
      'headers': {
        'type': 'object',
        'propertyNames': {
          'pattern': '^[\\w-]+$'
        },
        'patternProperties': {
          '[\\w-]+': { 'type': 'string' }
        }
      },
      'data': {
        'type': 'object'
      }
    },
    'additionalProperties': false
  }
};

const schema = {
  '$id': 'ResponseDefs.json',
  'oneOf': [
    {
      '$ref': 'Response.json#/resposeDef'
    },
    {
      'type': 'array',
      'items': {
        '$ref': 'Response.json#/resposeDef'
      }
    }
  ]
};

module.exports = (responseConfig, resourcePath, method) => {
  if (!SUPPORTED_METHODS.includes(method)) {
    throw new Error(`Method ${method} is not supported.`);
  }
  var ajv = new Ajv({ schemas: [schema, responseSchema] });
  var validate = ajv.getSchema('ResponseDefs.json');
  const valid = validate(responseConfig);
  if (!valid) {
    // usually only the first error is interesting, further ones are just the result of parser panicking and
    // failing the oneOf check
    const prop = validate.errors[0].propertyName;
    const path = validate.errors[0].dataPath;
    const msg = validate.errors[0].message;
    throw new Error(`Validation error: ${prop ? `property [${prop}] at path ` : ''}'${path}' ${msg}.`);
  }
};
