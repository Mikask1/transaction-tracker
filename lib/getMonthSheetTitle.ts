export default function getMonthSheetTitle(dateInput?: Date | string | null): string {
    let date: Date | null = null;
    if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
        date = dateInput;
    } else if (typeof dateInput === "string") {
        const parsed = new Date(dateInput);
        if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
    if (!date) date = new Date();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${month} ${year}`;
}