export const getUserTimezone = (): string | undefined => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return undefined;
    }
};

export const isSwissTimezone = (timezone = getUserTimezone()): boolean => timezone === 'Europe/Zurich';
