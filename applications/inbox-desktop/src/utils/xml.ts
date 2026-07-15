/**
 * escapeXML given an input string escapes XML metacharacters and
 * returns a safe string for XML windows toast.
 **/
export const escapeXML = (input: string): string => {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
};
