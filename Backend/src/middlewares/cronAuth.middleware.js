export function cronAuth(req, res, next) {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        return res.status(503).json({
            error: "CRON_SECRET no está configurado en el servidor."
        });
    }

    const header = req.headers.authorization || "";

    if (header !== `Bearer ${secret}`) {
        return res.status(401).json({ error: "No autorizado." });
    }

    next();
}

export default cronAuth;
