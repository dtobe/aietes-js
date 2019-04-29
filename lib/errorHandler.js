const _handleUnconfiguredRoutes = (req, res) => {
    console.warn(`Unconfigured route called: ${req.path}, method: ${req.method}, host: ${req.get('Host')}`);
    res.status(404);
    res.json({
        error: {
            message: `Route ${req.path} and method ${req.method} are not configured.`,
        },
    })
};

module.exports = _handleUnconfiguredRoutes;
