const { log } = require('./logging');

const _handleUnconfiguredRoutes = (req, res) => {
  log.warn(`Unconfigured route called: ${req.path}, method: ${req.method}`);
  res.status(404);
  res.json({
    error: {
      message: `Route ${req.path} and method ${req.method} are not configured.`
    }
  });
};

module.exports = _handleUnconfiguredRoutes;
