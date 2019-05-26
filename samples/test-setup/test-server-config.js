const setup = config => {
  process.env.NODE_CONFIG = JSON.stringify({
    'end-point': {
      'external-service': {
        'currentprice': `http://localhost:${config.server_port}/api/currentprice`
      }
    }
  });
};

const clear = () => {
  process.env.NODE_CONFIG = null;
};

module.exports = {
  setup,
  clear
};
