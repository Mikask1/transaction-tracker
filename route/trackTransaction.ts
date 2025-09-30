import { Router } from "express";
import authenticateApiKey from "../middleware/auth";
import { appendToSheet, extractTransaction } from "../service/trackTransaction";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post(
    "/track",
    authenticateApiKey,
    upload.single("transaction_image"),
    async (req: Request, res: Response) => {
        try {
            const spreadsheetId = (req.body?.spreadsheetId as string)
                || (req.header("x-spreadsheet-id") as string)
                || (req.query.spreadsheetId as string);
            if (!spreadsheetId) {
                res.status(400).send("spreadsheetId is required");
                return;
            }
            const file = req.file;
            if (!file) {
                res.status(400).send("transaction_image is required");
                return;
            }
            const extracted = await extractTransaction(file.buffer, file.mimetype);
            const id = uuidv4();
            await appendToSheet(spreadsheetId, { ...extracted, id });
            res.type("text/plain").send("Transaction tracked");
        } catch (err: any) {
            if (err && err.stack) {
                console.error(err.stack);
            } else {
                console.error(err);
            }
            res.status(500).send("Failed to track transaction");
        }
    }
);  


export default router;