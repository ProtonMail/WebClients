/**
 * Uncapitalize the first letter in a string.
 */
export default function uncapitalize(str: any) {
    if (str === '' || typeof str !== 'string') {
        return '';
    }
    return str[0].toLowerCase() + str.slice(1);
}
