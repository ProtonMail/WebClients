import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

export const shouldUse12HourClock = (timeFormat: SETTINGS_TIME_FORMAT) => {
    const locale = dateLocale.code || 'en-US';
    return (
        timeFormat === SETTINGS_TIME_FORMAT.H12 ||
        (timeFormat === SETTINGS_TIME_FORMAT.LOCALE_DEFAULT && locale.includes('en-US'))
    );
};

export const formatTimeHHMM = (date: Date, timeFormat: SETTINGS_TIME_FORMAT, timezone?: string): string => {
    const locale = dateLocale.code || 'en-US';
    const use12Hour = shouldUse12HourClock(timeFormat);

    const formatter = new Intl.DateTimeFormat(locale, {
        ...(timezone && { timeZone: timezone }),
        hour: 'numeric',
        minute: '2-digit',
        hour12: use12Hour,
    });

    const timeString = formatter.format(date);
    return use12Hour ? timeString.toUpperCase() : timeString;
};
