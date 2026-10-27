import type { ScheduleTiming } from '@proton/lumo-api-client/core/desktop-schedules';
import { convertZonedDateTimeToUTC, toUTCDate } from '@proton/shared/lib/date/timezone';

import {
    ALWAYS_LOCAL_TIMEZONE_ID,
    type RecurrenceRule,
    type WeekdayToken,
} from '../../components/RecurrenceRuleFieldset/types';

const weekdays: Record<WeekdayToken, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };

/** Converts editor recurrence values to the timing contract understood by desktop. */
export function toDesktopTiming(rule: RecurrenceRule, localTimezone: string): ScheduleTiming {
    const timezone = rule.timezone === ALWAYS_LOCAL_TIMEZONE_ID ? localTimezone : rule.timezone;
    const time = `${String(rule.hour).padStart(2, '0')}:${String(rule.minute).padStart(2, '0')}`;
    switch (rule.frequency) {
        case 'ONCE': {
            const [year, month, day] = rule.date.split('-').map(Number);
            const at = toUTCDate(
                convertZonedDateTimeToUTC(
                    { year, month, day, hours: rule.hour, minutes: rule.minute, seconds: 0 },
                    timezone
                )
            );
            return { kind: 'once', at: at.toISOString() };
        }
        case 'DAILY':
            return { kind: 'daily', time, timezone };
        case 'WEEKLY':
            return {
                kind: 'weekly',
                days: rule.byWeekDay.map((day) => weekdays[day]).sort((a, b) => a - b),
                time,
                timezone,
            };
        case 'MONTHLY':
            return { kind: 'monthly', days: [...rule.byMonthDay].sort((a, b) => a - b), time, timezone };
    }
}
