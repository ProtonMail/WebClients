export const DEFAULT_TRUNCATE_OMISSION = '…';

/**
 * Truncate `str` to a maximum length `charsToDisplay`.
 * Appends `omission` if `str` is too long.
 *
 * The length of the string returned (which may include
 * the omission) will not exceed `charsToDisplay`.
 */
export default function truncate(
    /**
     * String to truncate.
     */
    str: string,
    /**
     * Number of characters to display.
     */
    charsToDisplay = 50,
    /**
     * The string appended if `str` is too long.
     */
    omission = DEFAULT_TRUNCATE_OMISSION
) {
    if (str.length === 0 || str.length <= charsToDisplay) {
        return str;
    }

    return str.substring(0, charsToDisplay - omission.length) + omission;
}
