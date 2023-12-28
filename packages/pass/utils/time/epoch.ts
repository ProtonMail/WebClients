/** The Unix epoch (or Unix time or POSIX time or Unix timestamp) is
 * the number of seconds that have elapsed since January 1, 1970
 * (midnight UTC/GMT) */
export const getEpoch = (): number => Math.round(new Date().getTime() / 1_000);
export const epochToMs = (s: number) => s * 1_000;
export const msToEpoch = (ms: number) => Math.floor(ms / 1_000);
export const epochToDate = (s: number): Date => new Date(s * 1_000);
