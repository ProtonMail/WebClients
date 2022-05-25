/**
 * Uncapitalize the first letter in a string.
 */
export default function uncapitalize(str: string) {
    if (str === '') {
        return '';
    }
    return str[0].toLowerCase() + str.slice(1);
}
