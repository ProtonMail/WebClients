export function parseInteger(s: string): number | null {
    // Ensure string matches pattern for non-negative integers
    if (/^\d+$/.test(s)) {
        const i = Number(s);
        if (Number.isSafeInteger(i)) {
            return i;
        }
    }

    return null;
}
