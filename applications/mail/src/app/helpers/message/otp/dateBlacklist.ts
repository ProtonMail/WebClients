/**
 * Build the set of digit strings that match permutations of the email's own send
 * date (YYYYMMDD, DDMMYY, MMDDYYYY, etc.). These frequently appear in mail bodies
 * and headers and would otherwise win on weight, so candidates matching them are
 * dropped. Takes a Unix timestamp in seconds.
 */
export function dateBlacklist(timestamp: number): Set<string> {
    const result = new Set<string>();
    if (!timestamp || !Number.isFinite(timestamp)) {
        return result;
    }
    const dt = new Date(timestamp * 1000);
    if (Number.isNaN(dt.getTime())) {
        return result;
    }

    const y4 = String(dt.getUTCFullYear()).padStart(4, '0');
    const y2 = y4.slice(2);
    const month = dt.getUTCMonth() + 1;
    const day = dt.getUTCDate();
    const months = [String(month).padStart(2, '0'), String(month)];
    const days = [String(day).padStart(2, '0'), String(day)];
    const years = [y2, y4];

    const forbidden = new Set<string>();
    forbidden.add(y4);
    for (const m of months) {
        for (const d of days) {
            for (const y of years) {
                forbidden.add(`${y}${m}${d}`);
                forbidden.add(`${d}${m}${y}`);
                forbidden.add(`${m}${d}${y}`);
                forbidden.add(`${y}${d}${m}`);
            }
            forbidden.add(`${m}${d}`);
            forbidden.add(`${d}${m}`);
        }
    }
    for (const s of forbidden) {
        if (s.length >= 4 && s.length <= 10) {
            result.add(s);
        }
    }
    return result;
}
