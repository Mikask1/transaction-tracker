/**
 * Builds a data URL for an uploaded image buffer.
 */
export default function toDataUrl(buffer: Buffer, mimetype: string): string {
    const base64 = buffer.toString("base64");
    return `data:${mimetype};base64,${base64}`;
}