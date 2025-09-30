import type { NextFunction, Request, Response } from "express";

function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
    const incomingKey = req.header("x-api-key");
    const expectedKey = process.env.API_KEY;
    if (!expectedKey) {
        res.status(500).send("Server misconfigured: API key not set");
        return;
    }
    if (!incomingKey || incomingKey !== expectedKey) {
        res.status(401).send("Unauthorized");
        return;
    }
    next();
}

export default authenticateApiKey;