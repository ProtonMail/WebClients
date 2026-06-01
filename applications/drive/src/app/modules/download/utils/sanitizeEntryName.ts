/**
 * Strips path-traversal sequences and directory separators from a single
 * entry name so files like: "../../evil.exe"  cannot escape the chosen extraction directory.
 * Each node name is a single path component; slashes and leading dots that
 * would move up the tree are replaced with underscores.
 */
export function sanitizeEntryName(name: string): string {
    let sanitized = name.replace(/[/\\]/g, '_');
    if (/^\.+$/.test(sanitized)) {
        sanitized = '_';
    }
    return sanitized || '_';
}
