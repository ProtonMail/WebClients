import { findTimeZone, getUTCOffset, listTimeZones } from '@protontech/timezone-support';
import { format } from 'date-fns';
import { c } from 'ttag';

import { formatTimezoneOffset } from '@proton/shared/lib/date/timezone';

import type { RecurrenceRule, RecurrenceRuleFrequency } from './types';

/** Maps a timezone-agnostic `YYYY-MM-DD` value to a `DateInput` value. */
export const onceDateStringToLocalDate = (date: string): Date => {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
};

/** Maps a `DateInput` value to a timezone-agnostic `YYYY-MM-DD` string. */
export const localDateToOnceDateString = (date: Date): string => {
    // eslint-disable-next-line custom-rules/date-formatting-locale
    return format(date, 'yyyy-MM-dd');
};

/** Switches the frequency type of a recurrence rule. */
export const switchFrequencyType = (rule: RecurrenceRule, frequency: RecurrenceRuleFrequency): RecurrenceRule => {
    const { hour, minute, timezone } = rule;

    switch (frequency) {
        case 'ONCE':
            return {
                frequency: 'ONCE',
                date: rule.frequency === 'ONCE' ? rule.date : localDateToOnceDateString(new Date()),
                hour,
                minute,
                timezone,
            };
        case 'DAILY':
            return { frequency: 'DAILY', hour, minute, timezone };
        case 'WEEKLY':
            return { frequency: 'WEEKLY', byWeekDay: [], hour, minute, timezone };
        case 'MONTHLY':
            return { frequency: 'MONTHLY', byMonthDay: [], hour, minute, timezone };
        default:
            return rule;
    }
};

/** Returns the frequency options for the frequency picker. */
export const getFrequencyOptions = (): { value: RecurrenceRuleFrequency; label: string }[] => [
    {
        value: 'ONCE',
        // translator: Label for the once frequency option.
        label: c('collider_2025:Option').t`Once`,
    },
    {
        value: 'DAILY',
        // translator: Label for the daily frequency option.
        label: c('collider_2025:Option').t`Daily`,
    },
    {
        value: 'WEEKLY',
        // translator: Label for the weekly frequency option.
        label: c('collider_2025:Option').t`Weekly`,
    },
    {
        value: 'MONTHLY',
        // translator: Label for the monthly frequency option.
        label: c('collider_2025:Option').t`Monthly`,
    },
];

/** Returns IANA timezones from `@protontech/timezone-support`, excluding `Etc/` zones. */
export const getIanaTimezones = (): { text: string; value: string; key: string }[] => {
    return listTimeZones()
        .filter((name) => !name.startsWith('Etc/'))
        .map((ianaName) => {
            const offset = getUTCOffset(Date.now(), findTimeZone(ianaName)).offset;
            const utcOffset = `GMT${formatTimezoneOffset(offset)}`;
            return {
                text: `${utcOffset} • ${ianaName}`,
                value: ianaName,
                key: ianaName,
                offset,
            };
        })
        .sort(({ offset: offsetA, value: nameA }, { offset: offsetB, value: nameB }) => {
            return offsetA === offsetB ? nameA.localeCompare(nameB) : offsetB - offsetA;
        });
};
