/**
 * Converts a string to a valid HTML ID.
 */
export const toValidHtmlId = (input: string) => {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\-_:.]/g, '-') // Replace invalid characters
        .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
        .replace(/-{2,}/g, '-'); // Collapse multiple dashes
};
