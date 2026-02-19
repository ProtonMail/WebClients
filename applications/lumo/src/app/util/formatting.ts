export function prettyBytes(n: number): string {
    if (n === 0) return 'Empty';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatPercent(x: number | undefined): string {
    const pc = ((x ?? 0) * 100).toFixed(0);
    return `${pc}%`;
}
