// Minimal fallback for browsers without Intl.ListFormat. Only format() is supported;
// locale and formatting options are ignored in favor of a comma-separated list.
if (typeof Intl.ListFormat === 'undefined') {
    Object.defineProperty(Intl, 'ListFormat', {
        configurable: true,
        writable: true,
        value: class {
            format(items: Iterable<string> = []): string {
                return Array.from(items).join(', ');
            }
        },
    });
}
