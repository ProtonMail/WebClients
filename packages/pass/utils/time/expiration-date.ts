/** Returns a tuple `[MM, YY|YYYY]` from a raw expiration date string.
 * Supported date formats for extraction :
 * - YYYY-MM
 * - MMYY
 * - MMYYYY
 * - MM[seperator]YY
 * - MM[seperator]YYYY */
const extractExpirationDateParts = (rawDate: string): [string, string] => {
    /* account for YYYY-MM format */
    if (/^(\d{4})-(\d{2})$/.test(rawDate)) return [rawDate.slice(-2), rawDate.slice(0, 4)];

    const date = rawDate.replaceAll(/\/|-|\.|,|\s/g, '');
    if (date.length === 4) return [date.slice(0, 2), date.slice(-2)];
    if (date.length === 6) return [date.slice(0, 2), date.slice(-4)];
    return ['', ''];
};

const isValidMonth = (maybeMonth: string): boolean => {
    const month = parseInt(maybeMonth, 10);
    return !isNaN(month) && month >= 1 && month <= 12;
};
const isValidYear = (maybeYear: string): boolean => {
    const year = parseInt(maybeYear, 10);
    return !isNaN(year) && year >= 0 && year <= 9999;
};

export const isValidExpirationDate = (date: string): boolean => {
    const [month, year] = extractExpirationDateParts(date);
    return isValidMonth(month) && isValidYear(year);
};

export const formatExpirationDateMMYY = (date: string): string => {
    const [month, year] = extractExpirationDateParts(date);
    return isValidMonth(month) && isValidYear(year) ? `${month}${year.slice(-2)}` : '';
};

export const formatExpirationDateMMYYYY = (date: string): string => {
    const [month, year] = extractExpirationDateParts(date);

    if (isValidMonth(month) && isValidYear(year)) {
        if (year.length === 4) return `${month}${year}`;
        const yearBase = new Date().getFullYear().toString().slice(0, 2);
        return `${month}${yearBase}${year}`;
    }

    return '';
};

/** Formats the provided date string as `YYYY-MM`.  */
export const formatExpirationDateYYYYMM = (date: string): string => {
    const [month, year] = extractExpirationDateParts(date);

    if (isValidMonth(month) && isValidYear(year)) {
        if (year.length === 4) return `${year}-${month}`;
        const yearBase = new Date().getFullYear().toString().slice(0, 2);
        return `${yearBase}${year}-${month}`;
    }

    return '';
};
