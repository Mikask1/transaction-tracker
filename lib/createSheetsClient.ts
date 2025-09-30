import { google, sheets_v4 } from "googleapis";
import path from "path";
import fs from "fs/promises";

/**
 * Creates a Google Sheets API client using the service account credentials.
 */
export default async function createSheetsClient(): Promise<sheets_v4.Sheets> {
    const credentialsPath = path.join(process.cwd(), "service_account_credentials.json");
    const json = await fs.readFile(credentialsPath, "utf8");
    const credentials = JSON.parse(json);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    return sheets;
}