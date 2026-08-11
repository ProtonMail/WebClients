import { fromUnixTime } from 'date-fns';

/**
 * Converts a `*LastModifiedTime` user setting into a date, treating 0 as never modified.
 */
export const getLastModifiedDate = (lastModifiedTime: number | null | undefined) => {
    return lastModifiedTime && lastModifiedTime > 0 ? fromUnixTime(lastModifiedTime) : null;
};
