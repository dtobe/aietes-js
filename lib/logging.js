const morgan = require('morgan');

const LOGGING_PREFIX = '[Aietes]';

const info = data => {
  if (!process.env.NO_OUTPUT) {
    console.log(`${LOGGING_PREFIX} ${data}`);
  }
};

const warn = data => {
  if (!process.env.NO_OUTPUT) {
    console.warn(`${LOGGING_PREFIX} ${data}`);
  }
};

const error = data => {
  console.error(`${LOGGING_PREFIX} ${data}`);
};

module.exports = {
  log: { info, warn, error },
  accessLog: morgan(`${LOGGING_PREFIX} :method :url :status :response-time[1] ms - :res[content-length] b`)
};
