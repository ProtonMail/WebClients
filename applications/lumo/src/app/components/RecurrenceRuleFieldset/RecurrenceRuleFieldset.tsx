import { useId, useMemo } from 'react';

import { clsx } from 'clsx';
import { startOfDay } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import DateInput from '@proton/components/components/input/DateInput';
import TimeInput from '@proton/components/components/input/TimeInput';
import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { LumoIcon } from '../LumoIcon/LumoIcon';
import { FieldError } from './FieldError';
import { MonthDayPicker } from './MonthDayPicker';
import { WeekDayPicker } from './WeekDayPicker';
import type {
    RecurrenceRule,
    RecurrenceRuleFieldErrors,
    RecurrenceRuleFrequency,
    RecurrenceRuleValidationField,
} from './types';
import { ALWAYS_LOCAL_TIMEZONE_ID } from './types';
import {
    getFrequencyOptions,
    getIanaTimezones,
    localDateToOnceDateString,
    onceDateStringToLocalDate,
    switchFrequencyType,
} from './utils';

import './RecurrenceRuleFieldset.scss';

interface RecurrenceRuleFieldsetProps {
    fieldErrors?: RecurrenceRuleFieldErrors;
    onChange: (recurrenceRule: RecurrenceRule) => void;
    onClearValidationField?: (field: RecurrenceRuleValidationField | RecurrenceRuleValidationField[]) => void;
    recurrenceRule: RecurrenceRule;
    title: string;
}

export const RecurrenceRuleFieldset = ({
    fieldErrors,
    onChange,
    onClearValidationField,
    recurrenceRule,
    title,
}: RecurrenceRuleFieldsetProps) => {
    const [userSettings] = useUserSettings();
    const id = useId();

    const timezoneOptions = useMemo(() => {
        // translator: Label for the option to run at the user's local time zone on each device.
        const alwaysLocalTimeZoneLabel = c('collider_2025:Option').t`Always local time`;

        return [
            <Option key={ALWAYS_LOCAL_TIMEZONE_ID} title={alwaysLocalTimeZoneLabel} value={ALWAYS_LOCAL_TIMEZONE_ID} />,
            ...getIanaTimezones().map(({ text, value, key }) => <Option key={key} title={text} value={value} />),
        ];
    }, []);

    return (
        <fieldset
            aria-labelledby={`${id}-recurrence-rule`}
            className="recurrence-rule-fieldset flex flex-column items-start m-0 p-0 border-none"
        >
            {/** Header */}
            <div className="flex flex-nowrap items-center justify-space-between w-full m-0 mb-2 text-rg">
                <span className="text-semibold" id={`${id}-recurrence-rule`}>
                    {title}
                </span>

                {/** Timezone field */}
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
                        onChange={({ value }) => {
                            onClearValidationField?.('dateTime');
                            onChange({ ...recurrenceRule, timezone: value });
                        }}
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
                    'grid gap-2 w-full',
                    (recurrenceRule.frequency === 'WEEKLY' || recurrenceRule.frequency === 'MONTHLY') && 'mb-3',
                    recurrenceRule.frequency === 'ONCE' ? 'grid-cols-3' : 'grid-cols-2',
                ])}
            >
                {/** Frequency field */}
                <span className="sr-only" id={`${id}-frequency`}>{
                    // translator: Accessibility label for the frequency selector (e.g. "Daily", "Weekly").
                    c('collider_2025:Label').t`Frequency`
                }</span>
                <SelectTwo<RecurrenceRuleFrequency>
                    aria-labelledby={`${id}-frequency`}
                    className="pl-3 border border-weak rounded"
                    onChange={({ value }) => {
                        onClearValidationField?.(['time', 'dateTime', 'weekDayPicker', 'monthDayPicker']);
                        onChange(switchFrequencyType(recurrenceRule, value));
                    }}
                    value={recurrenceRule.frequency}
                >
                    {getFrequencyOptions().map((option) => (
                        <Option key={option.value} title={option.label} value={option.value} />
                    ))}
                </SelectTwo>

                {/** Date field */}
                {recurrenceRule.frequency === 'ONCE' && (
                    <>
                        <span className="sr-only" id={`${id}-date`}>{
                            // translator: Accessibility label for the date selector.
                            c('collider_2025:Label').t`Date`
                        }</span>
                        <DateInput
                            aria-describedby={fieldErrors?.dateTime ? `${id}-date-time-error` : undefined}
                            aria-invalid={!!fieldErrors?.dateTime}
                            aria-labelledby={`${id}-date`}
                            className={clsx([
                                'border border-weak rounded flex-1',
                                fieldErrors?.dateTime && 'border-danger',
                            ])}
                            min={startOfDay(Date.now())}
                            onChange={(date) => {
                                if (date) {
                                    onClearValidationField?.('dateTime');
                                    onChange({ ...recurrenceRule, date: localDateToOnceDateString(date) });
                                }
                            }}
                            value={onceDateStringToLocalDate(recurrenceRule.date)}
                            weekStartsOn={getWeekStartsOn(userSettings)}
                        />
                    </>
                )}

                {/** Time field */}
                <span className="sr-only" id={`${id}-time`}>{
                    // translator: Accessibility label for the time selector (e.g. "07:45 AM").
                    c('collider_2025:Label').t`Time`
                }</span>
                <TimeInput
                    aria-describedby={
                        fieldErrors?.time
                            ? `${id}-time-error`
                            : fieldErrors?.dateTime
                              ? `${id}-date-time-error`
                              : undefined
                    }
                    aria-invalid={!!fieldErrors?.time || !!fieldErrors?.dateTime}
                    aria-labelledby={`${id}-time`}
                    className={clsx([
                        'border-weak rounded flex-1',
                        (fieldErrors?.time || fieldErrors?.dateTime) && 'border-danger',
                    ])}
                    interval={15}
                    onChange={(date) => {
                        onClearValidationField?.(['time', 'dateTime']);
                        onChange({
                            ...recurrenceRule,
                            hour: date.getHours(),
                            minute: date.getMinutes(),
                        });
                    }}
                    // `TimeInput` expects a `Date`; stored hour/minute are timezone-agnostic — calendar day is arbitrary.
                    value={new Date(2000, 0, 1, recurrenceRule.hour, recurrenceRule.minute, 0, 0)}
                />
            </div>
            {fieldErrors?.time && <FieldError id={`${id}-time-error`} message={fieldErrors.time} />}
            {fieldErrors?.dateTime && <FieldError id={`${id}-date-time-error`} message={fieldErrors.dateTime} />}

            {/** Week day picker */}
            {recurrenceRule.frequency === 'WEEKLY' && (
                <WeekDayPicker
                    days={recurrenceRule.byWeekDay}
                    error={fieldErrors?.weekDayPicker}
                    onChange={(days) => {
                        onClearValidationField?.('weekDayPicker');
                        onChange({ ...recurrenceRule, byWeekDay: days });
                    }}
                />
            )}

            {/** Month day picker */}
            {recurrenceRule.frequency === 'MONTHLY' && (
                <MonthDayPicker
                    days={recurrenceRule.byMonthDay}
                    error={fieldErrors?.monthDayPicker}
                    onChange={(days) => {
                        onClearValidationField?.('monthDayPicker');
                        onChange({ ...recurrenceRule, byMonthDay: days });
                    }}
                />
            )}
        </fieldset>
    );
};
