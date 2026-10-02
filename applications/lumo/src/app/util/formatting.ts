export function formatPercent(x: number | undefined): string {
    const pc = ((x ?? 0) * 100).toFixed(0);
    return `${pc}%`;
}
