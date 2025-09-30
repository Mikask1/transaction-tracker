import { google, sheets_v4 } from "googleapis";

/**
 * Creates a Google Sheets API client using the service account credentials from an environment variable.
 * @returns {Promise<sheets_v4.Sheets>} The Google Sheets API client.
 */
export default async function createSheetsClient(): Promise<sheets_v4.Sheets> {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    if (!credentialsJson) {
        throw new Error("🛑 GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is not set");
    }
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    return sheets;
}