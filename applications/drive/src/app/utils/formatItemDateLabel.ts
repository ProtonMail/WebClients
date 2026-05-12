import { getUnixTime } from 'date-fns';

import { readableTimeIntl } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

// `<TimeIntl>` (the component rendered in our row cells) produces its visible
// string via `readableTimeIntl`. Calling it with the same options here means
// the row aria-label announces exactly what the cell shows.
const intlOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: 'numeric',
};

// date-fns long time formats contain 'a' or 'b' for 12h locales.
const is12HourDateFnsFormat = (formatString: string | undefined) => !!formatString && /a|b/.test(formatString);

export const formatItemDateLabel = (date: Date): string =>
    readableTimeIntl(getUnixTime(date), {
        localeCode: dateLocale?.code,
        hour12: is12HourDateFnsFormat(dateLocale?.formatLong?.time()),
        intlOptions,
    });
