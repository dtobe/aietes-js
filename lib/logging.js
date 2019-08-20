const LOGGING_PREFIX = '[Aietes]';

const info = data => {
  if (!process.env.NO_OUTPUT) {
    console.log(`${LOGGING_PREFIX} INFO - ${data}`);
  }
};

const warn = data => {
  if (!process.env.NO_OUTPUT) {
    console.warn(`${LOGGING_PREFIX} ${data}`);
  }
};

const error = data => {
  if (!process.env.NO_OUTPUT) {
    console.error(`${LOGGING_PREFIX} ${data}`);
  }
};

module.exports = { info, warn, error };
