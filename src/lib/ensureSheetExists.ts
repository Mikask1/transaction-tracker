import type { sheets_v4 } from "googleapis";
import toColumnLetter from "@/lib/toColumnLetter";

/**
 * Ensures a sheet with the given title exists in the spreadsheet, creating it if needed.
 */
export default async function ensureSheetExists(sheets: sheets_v4.Sheets, spreadsheetId: string, title: string, headers: string[]): Promise<void> {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = (spreadsheet.data.sheets ?? []).some(s => s.properties?.title === title);
    if (exists) return;
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                { addSheet: { properties: { title } } }
            ]
        }
    });
    const lastCol = toColumnLetter(headers.length);
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${title}!A1:${lastCol}1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] }
    });
}