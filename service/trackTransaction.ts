import { z } from "zod";
import createSheetsClient from "../lib/createSheetsClient";
import ExtractionSchema from "../schema/ExtractionSchema";
import createOpenRouter from "../lib/createOpenRouterLLM";
import toDataUrl from "../utils/toDataUrl";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import RobustStructuredOutputParser from "../lib/RobustStructuredOutoutParser";
import getMonthSheetTitle from "../lib/getMonthSheetTitle";
import ensureSheetExists from "../lib/ensureSheetExists";

/**
 * Appends a transaction record to the provided spreadsheet.
 */
export async function appendToSheet(spreadsheetId: string, record: z.infer<typeof ExtractionSchema> & { id: string }): Promise<void> {
    const sheets = await createSheetsClient();
    const sheetTitle = getMonthSheetTitle(record.transactionDate as unknown as Date | string | null);
    const headers = [
        "ID",
        "Transaction Date",
        "Recipient Name",
        "Recipient Bank",
        "Recipient Account Number",
        "Service",
        "Message",
        "Category",
        "Amount",
        "Admin Fee",
    ];
    await ensureSheetExists(sheets, spreadsheetId, sheetTitle, headers);
    const transactionDateStr = new Date(record.transactionDate).toISOString();
    const values = [[
        record.id,
        transactionDateStr,
        record.recipientName ?? "",
        record.recipientBank ?? "BCA",
        record.recipientAccountNumber ?? "",
        record.service ?? "",
        record.message ?? "",
        record.category ?? "",
        record.amount ?? 0,
        record.adminFee ?? 0,
    ]];
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetTitle}!A:K`,
        valueInputOption: "RAW",
        requestBody: { values },
    });
}


/**
 * Extracts transaction data from an image buffer using an LLM.
 */
export async function extractTransaction(buffer: Buffer, mimetype: string): Promise<z.infer<typeof ExtractionSchema>> {
    const llm = createOpenRouter({ primaryModel: "openai/gpt-4.1-mini", responseFormat: "json" });
    const imageUrl = toDataUrl(buffer, mimetype);
    const system = new SystemMessage(
        "You are an information extraction engine. Extract fields from bank transaction receipts of a user in Indonesia. The user is a BCA customer. Return strictly a compact JSON object."
    );
    const user = new HumanMessage({
        content: [
            {
                type: "text", text: [
                    "Extract these fields:",
                    `- transactionDate: ISO-8601 (if there are no year, then assume it is ${new Date().getFullYear()})`,
                    "- recipientName.",
                    "- recipientBank (default BCA if not mentioned).",
                    "- recipientAccountNumber.",
                    "- service (BI FAST or Realtime Online).",
                    "- message.",
                    "- category (cannot be null or empty, derive this category from the message or recipientName or service e.g. e-wallet, shopping, food, etc.)",
                    "- amount.",
                    "- adminFee.",
                    "Rules:",
                    "- Output valid JSON only."
                ].join("\n")
            },
            { type: "image_url", image_url: { url: imageUrl } },
        ],
    });

    let result: z.infer<typeof ExtractionSchema> | null = null;
    const error = []
    while (error.length < 3) {
        try {
            result = await llm
                .pipe(new RobustStructuredOutputParser(ExtractionSchema))
                .invoke([system, user, new HumanMessage(`The last invocation failed with the following error, please revise your response: ${error.join("\n")}`)])
            if (result) break;
        } catch (err) {
            if (err instanceof Error && err.stack) {
                error.push(err.stack);
                console.log("[ERROR]: ", err.stack);
            } else if (err instanceof Error) {
                error.push(err.message);
                console.log("[ERROR] ", err.message);
            } else {
                error.push(String(err));
                console.log("[ERROR] ", String(err));
            }
        }
        if (result) break;
    }

    if (!result) throw new Error("Failed to extract transaction data");

    return result;
}