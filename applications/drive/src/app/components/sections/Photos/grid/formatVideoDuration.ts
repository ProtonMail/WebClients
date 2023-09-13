import { dateLocale } from '@proton/shared/lib/i18n';

export const formatVideoDuration = (seconds: number, localeCode = dateLocale.code) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    let formattedDuration = '';

    if (hours > 0) {
        formattedDuration += `${hours}:`;
    }

    const minutesFormatted = new Intl.NumberFormat(localeCode, {
        minimumIntegerDigits: hours > 0 ? 2 : 1,
    }).format(minutes);

    const secondsFormatted = new Intl.NumberFormat(localeCode, {
        minimumIntegerDigits: 2,
    }).format(remainingSeconds);

    formattedDuration += `${minutesFormatted}:${secondsFormatted}`;

    return formattedDuration;
};
