const _handleUnconfiguredRoutes = (req, res) => {
    console.warn("Unconfigured route called.")
    res.status(404)
    res.json({
        error: {
            message: "The route was not configured!",
        },
    })
};

module.exports = {
    _handleUnconfiguredRoutes,
};
