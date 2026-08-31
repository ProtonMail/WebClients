/**
 * Remove every character that is not a digit (0-9) from a string.
 *
 * @param str - String to strip non-digit characters from.
 * @returns A new string containing only the digits found in `str`.
 */
export default function extractDigits(str: string): string {
    return str.replace(/\D/g, '');
}
