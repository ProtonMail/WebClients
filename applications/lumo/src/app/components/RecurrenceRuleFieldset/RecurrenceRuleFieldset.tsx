import { useId, useMemo } from 'react';

import { clsx } from 'clsx';
import { format, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { DateInput, DropdownSizeUnit, Option, SearchableSelect, SelectTwo, TimeInput } from '@proton/components';
import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { LumoIcon } from '../LumoIcon/LumoIcon';
import { MonthDayPicker } from './MonthDayPicker';
import { WeekDayPicker } from './WeekDayPicker';
import type { RecurrenceRule, RecurrenceRuleFrequency } from './types';
import { ALWAYS_LOCAL_TIMEZONE_ID } from './types';

import './RecurrenceRuleFieldset.scss';

/** Maps a timezone-agnostic `YYYY-MM-DD` value to a `DateInput` value. */
const onceDateStringToLocalDate = (date: string): Date => {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
};

/** Maps a `DateInput` value to a timezone-agnostic `YYYY-MM-DD` string. */
const localDateToOnceDateString = (date: Date): string => {
    // eslint-disable-next-line custom-rules/date-formatting-locale
    return format(date, 'yyyy-MM-dd');
};

interface RecurrenceRuleFieldsetProps {
    onChange: (recurrenceRule: RecurrenceRule) => void;
    recurrenceRule: RecurrenceRule;
    title: string;
}

export const RecurrenceRuleFieldset = ({ onChange, recurrenceRule, title }: RecurrenceRuleFieldsetProps) => {
    const [userSettings] = useUserSettings();
    const id = useId();

    const timezoneOptions = useMemo(() => {
        // translator: Label for the option to run at the user's local time zone on each device.
        const alwaysLocalTimeZoneLabel = c('collider_2025:Option').t`Always local time`;
        return [
            <Option key={ALWAYS_LOCAL_TIMEZONE_ID} title={alwaysLocalTimeZoneLabel} value={ALWAYS_LOCAL_TIMEZONE_ID} />,
            ...getTimeZoneOptions().map(({ text, value, key }) => <Option key={key} title={text} value={value} />),
        ];
    }, [recurrenceRule.frequency]);

    return (
        <fieldset
            aria-labelledby={`${id}-recurrence-rule`}
            className="recurrence-rule-fieldset flex flex-column items-start m-0 p-0 border-none"
        >
            <div className="flex flex-nowrap items-center justify-space-between w-full m-0 mb-2 text-rg">
                <span className="text-semibold" id={`${id}-recurrence-rule`}>
                    {title}
                </span>
                <div className="flex flex-nowrap items-center gap-1 color-weak">
                    <span className="shrink-0">
                        {recurrenceRule.timezone === ALWAYS_LOCAL_TIMEZONE_ID
                            ? // translator: Label for the option to run at the user's local time zone on each device.
                              c('collider_2025:Option').t`Always local time`
                            : recurrenceRule.timezone}
                    </span>
                    <SearchableSelect
                        className="recurrence-rule-fieldset__timezone-button min-w-0 p-0 border border-transparent rounded shrink-0 interactive interactive--no-background"
                        fullWidth={false}
                        noCaret
                        onChange={({ value }) => onChange({ ...recurrenceRule, timezone: value })}
                        renderSelected={() => <LumoIcon className="block" name="Settings" size={16} />}
                        search
                        searchPlaceholder={c('Timezone search placeholder').t`Search time zones`}
                        size={{
                            width: DropdownSizeUnit.Dynamic,
                            maxWidth: DropdownSizeUnit.Viewport,
                        }}
                        title={c('collider_2025:Action').t`Select time zone`}
                        unstyled
                        value={recurrenceRule.timezone}
                    >
                        {timezoneOptions}
                    </SearchableSelect>
                </div>
            </div>

            <div
                className={clsx([
                    'grid gap-2 w-full mb-3',
                    recurrenceRule.frequency === 'ONCE' ? 'grid-cols-3' : 'grid-cols-2',
                ])}
            >
                <span className="sr-only" id={`${id}-frequency`}>{
                    // translator: Accessibility label for the frequency selector (e.g. "Daily", "Weekly").
                    c('collider_2025:Label').t`Frequency`
                }</span>
                <SelectTwo<RecurrenceRuleFrequency>
                    aria-labelledby={`${id}-frequency`}
                    className="pl-3 border border-weak rounded"
                    onChange={({ value }) => onChange(switchFrequencyType(recurrenceRule, value))}
                    value={recurrenceRule.frequency}
                >
                    {getFrequencyOptions().map((option) => (
                        <Option key={option.value} title={option.label} value={option.value} />
                    ))}
                </SelectTwo>

                {recurrenceRule.frequency === 'ONCE' && (
                    <>
                        <span className="sr-only" id={`${id}-date`}>{
                            // translator: Accessibility label for the date selector.
                            c('collider_2025:Label').t`Date`
                        }</span>
                        <DateInput
                            aria-labelledby={`${id}-date`}
                            className="border border-weak rounded flex-1"
                            min={startOfDay(Date.now())}
                            onChange={(date) => {
                                if (date) {
                                    onChange({ ...recurrenceRule, date: localDateToOnceDateString(date) });
                                }
                            }}
                            value={onceDateStringToLocalDate(recurrenceRule.date)}
                            weekStartsOn={getWeekStartsOn(userSettings)}
                        />
                    </>
                )}

                <span className="sr-only" id={`${id}-time`}>{
                    // translator: Accessibility label for the time selector (e.g. "07:45 AM").
                    c('collider_2025:Label').t`Time`
                }</span>
                <TimeInput
                    aria-labelledby={`${id}-time`}
                    className="border-weak rounded flex-1"
                    interval={15}
                    onChange={(date) =>
                        onChange({
                            ...recurrenceRule,
                            hour: date.getHours(),
                            minute: date.getMinutes(),
                        })
                    }
                    // `TimeInput` expects a `Date`; stored hour/minute are timezone-agnostic — calendar day is arbitrary.
                    value={new Date(2000, 0, 1, recurrenceRule.hour, recurrenceRule.minute, 0, 0)}
                />
            </div>

            {recurrenceRule.frequency === 'WEEKLY' && (
                <WeekDayPicker
                    days={recurrenceRule.byWeekDay}
                    onChange={(days) => onChange({ ...recurrenceRule, byWeekDay: days })}
                />
            )}

            {recurrenceRule.frequency === 'MONTHLY' && (
                <MonthDayPicker
                    days={recurrenceRule.byMonthDay}
                    onChange={(days) => onChange({ ...recurrenceRule, byMonthDay: days })}
                />
            )}
        </fieldset>
    );
};

const switchFrequencyType = (rule: RecurrenceRule, frequency: RecurrenceRuleFrequency): RecurrenceRule => {
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
const getFrequencyOptions = (): { value: RecurrenceRuleFrequency; label: string }[] => [
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
