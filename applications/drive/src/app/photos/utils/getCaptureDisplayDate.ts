// ISO 8601 date time with "Z" or a "±HH:MM" offset, optional milliseconds.
// Matches: "2026-09-19T18:22:16.000+02:00", "2026-09-19T18:22:16Z"
// Groups: year, month, day, hours, minutes, seconds, offset ("Z" or "+02:00")
const CLAIMED_CAPTURE_TIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const toSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

// Claimed capture time keeps the camera's wall-clock time (eg. "18:22" from
// "2026-09-19T18:22:16.000+02:00"), rather than the absolute instant.
// No claimed capture time --> captureTime in the viewer timezone.
export const getCaptureDisplayDate = (claimedCaptureTime: string | undefined, captureTime: Date) => {
    const match = claimedCaptureTime?.match(CLAIMED_CAPTURE_TIME_REGEX);
    if (!claimedCaptureTime || !match) {
        return captureTime;
    }
    // "Z" should be the real UTC instant (eg. iOS writes 07:44Z for 15:44+08:00), but until September 2026
    // web wrongly wrote the camera wall-clock time with "Z" (eg. 18:22Z for 18:22+02:00).
    // Same instant as captureTime --> real UTC instant --> captureTime in the viewer timezone.
    // Old web uploads from a browser on UTC look the same, so they also fall back to captureTime.
    // TODO: Remove this check once we can update the xattr after the first upload to fix old web uploads.
    const isUtcInstant = match[7] === 'Z' && toSeconds(new Date(claimedCaptureTime)) === toSeconds(captureTime);
    if (isUtcInstant) {
        return captureTime;
    }
    // Date constructor with the wall-clock components --> local date time,
    // intentionally without applying the offset from the claimed value.
    const [year, month, day, hours, minutes, seconds] = match.slice(1, 7).map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
};
