const security = require("../../middleware/security");

module.exports = function (app) {

    function listRoutes() {
        const list = app._router.stack
            .filter(layer => layer.route)
            .map(layer => ({
                method: Object.keys(layer.route.methods).join(', ').toUpperCase(),
                path: layer.route.path
            }));
        return list.length;
    }

    function runtime(seconds) {
        seconds = Math.floor(seconds);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }

    app.get('/api/status', async (req, res) => {
        try {
            res.status(200).json({
                status: true,
                creator: "Nimzz",
                result: {
                    status: "Aktif",
                    totalrequest: String(security.stats.totalRequests),
                    totalfitur: String(listRoutes()),
                    error: String(security.stats.totalErrors),
                    runtime: runtime(process.uptime()),
                    domain: req.hostname
                }
            });
        } catch (error) {
            security.incrementErrors();
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: `Terjadi kesalahan internal: ${error.message}`
            });
        }
    });

    app.get('/api/reset-errors', async (req, res) => {
        try {
            const previousCount = security.resetErrors();
            res.status(200).json({
                status: true,
                creator: "Nimzz",
                message: `Error count reset from ${previousCount} to 0`
            });
        } catch (error) {
            security.incrementErrors();
            res.status(500).json({
                status: false,
                creator: "Nimzz",
                message: `Terjadi kesalahan: ${error.message}`
            });
        }
    });
};
