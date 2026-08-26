/**
 * Capitalize the first letter in a string.
 */
export default function capitalize(str: string | undefined) {
    if (str === undefined) {
        return;
    }

    if (str === '') {
        return str;
    }
    return str[0].toUpperCase() + str.slice(1);
}
