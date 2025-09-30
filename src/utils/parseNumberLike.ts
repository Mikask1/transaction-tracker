export default function parseNumberLike(value: unknown): number | unknown {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return value;
    const normalized = value
        .replace(/[^0-9.,-]/g, "")
        .replace(/(,)(?=\d{3}(\D|$))/g, "")
        .replace(/\.(?=\d{3}(\D|$))/g, "")
        .replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
}