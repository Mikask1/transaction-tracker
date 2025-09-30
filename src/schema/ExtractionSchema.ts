import parseNumberLike from "../utils/parseNumberLike";
import { z } from "zod";

const ExtractionSchema = z.object({
    transactionDate: z.string().default(new Date().toISOString()).describe("ISO-8601"),
    recipientName: z.string().describe("The name of the recipient"),
    recipientBank: z.string().default("BCA").describe("The bank of the recipient"),
    recipientAccountNumber: z.string().nullish().describe("The account number of the recipient"),
    service: z.enum(["BI FAST", "Realtime Online", "Direct Bank Transfer (BCA)", "Direct Bank Transfer (Other)"]).describe("The service used for the transaction"),
    message: z.string().nullable().optional().describe("The message of the transaction"),
    category: z.string().describe("The category of the transaction"),
    amount: z.preprocess((v) => parseNumberLike(v), z.number()).describe("The amount of the transaction"),
    adminFee: z.number().default(0).describe("The admin fee of the transaction"),
});

export default ExtractionSchema