import { dateLocale } from '@proton/shared/lib/i18n';

export const toSpecificTimezone = (date: Date, timeZone: string) => {
    const localeString = date.toLocaleString(dateLocale.code, { timeZone, timeZoneName: 'longOffset' });
    const [, hours, minutes] = (localeString.match(/([+-]\d+):(\d+)$/) ?? [, '+00', '00']).map((string) =>
        Number(string)
    );
    const offset = (hours * 60 + (hours > 0 ? minutes : -minutes)) * 60 * 1000;

    return new Date(date.getTime() + offset);
};
