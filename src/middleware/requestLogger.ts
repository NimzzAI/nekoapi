import { Request, Response, NextFunction } from 'express';

/**
 * Custom middleware that logs all incoming request paths and their response times to the console.
 * Helps with debugging and monitoring server performance.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    const reqPath = req.originalUrl || req.url || req.path;
    let logged = false;

    const logTiming = () => {
        if (logged) return;
        logged = true;

        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;
        const formattedDuration = `${durationMs.toFixed(2)}ms`;
        const method = req.method;
        const statusCode = res.statusCode;

        console.log(`[REQUEST] ${method} ${reqPath} -> ${statusCode} in ${formattedDuration}`);
    };

    res.on('finish', logTiming);
    res.on('close', logTiming);

    next();
};
