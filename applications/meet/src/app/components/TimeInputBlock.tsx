import type { ReactNode } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import DateInputTwo from '@proton/components/components/v2/input/DateInputTwo';
import { IcClock } from '@proton/icons/icons/IcClock';
import type { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';
import clsx from '@proton/utils/clsx';

import type { FormValues, OnDateTimeChange } from './MeetingCreation/ScheduleMeetingModal/ScheduleMeetingForm/types';
import { TimeInput } from './TimeInput/TimeInput';

export const TimeInputBlock = ({
    name,
    values,
    onDateTimeChange,
    showTimezones,
    timeOptions,
    timeZoneOptions,
    timeFormat,
    showIcon = true,
    editableTimeZone = true,
    timeError,
    dateError,
}: {
    name: 'start' | 'end';
    values: FormValues;
    onDateTimeChange: OnDateTimeChange;
    showTimezones: boolean;
    timeOptions: { value: string; label: string }[];
    timeZoneOptions: { value: string; label: string; formattedText: ReactNode }[];
    timeFormat: SETTINGS_TIME_FORMAT;
    showIcon?: boolean;
    editableTimeZone?: boolean;
    timeError?: string | boolean;
    dateError?: string | boolean;
}) => {
    const labels =
        name === 'start'
            ? { date: c('Label').t`Start date`, time: c('Label').t`Start time` }
            : { date: c('Label').t`End date`, time: c('Label').t`End time` };

    return (
        <div className="w-full flex flex-nowrap items-center gap-4">
            <IcClock
                className={clsx('shrink-0', !showIcon && 'visibility-hidden')}
                size={5}
                style={{ color: 'var(--interaction-weak-major-3)' }}
            />
            <div className="flex-1 flex flex-column *:min-size-auto md:flex-row flex-nowrap items-center gap-2">
                <div
                    className={clsx('flex-1 flex flex-nowrap items-start gap-2', showTimezones && 'grow-custom')}
                    style={{ '--grow-custom': '1.25' }}
                >
                    <InputFieldTwo
                        as={DateInputTwo}
                        id={`${name}Date`}
                        name={`${name}Date`}
                        aria-label={labels.date}
                        min={new Date(Date.now() - 24 * 60 * 60 * 1000)}
                        preventValueReset
                        onChange={(value) => onDateTimeChange({ fieldName: `${name}Date`, value })}
                        rootClassName="flex-1"
                        className="date-input"
                        inputClassName="date-input"
                        value={values[`${name}Date`]}
                        dropdownClassName="create-container-dropdown"
                        error={dateError}
                    />
                    <TimeInput
                        id={`${name}Time`}
                        name={`${name}Time`}
                        aria-label={labels.time}
                        value={values[`${name}Time`]}
                        onChange={(value) => onDateTimeChange({ fieldName: `${name}Time`, value })}
                        options={timeOptions}
                        timeFormat={timeFormat}
                        error={timeError}
                        className="flex-1"
                    />
                </div>
                {showTimezones && (
                    <SearchableSelect
                        name="timeZone"
                        className="w-full flex-1 select-two-timezone-select"
                        onChange={(item: { value: string }) => {
                            onDateTimeChange({ fieldName: 'timeZone', value: item.value });
                        }}
                        value={values.timeZone}
                        dropdownClassName="create-container-dropdown select-two-timezone-dropdown py-2"
                        search={true}
                        originalPlacement="bottom-start"
                        availablePlacements={['bottom-start']}
                        size={{
                            width: '25.25rem',
                            maxWidth: '25.25rem',
                            maxHeight: '20.5rem',
                        }}
                        disabled={!editableTimeZone}
                    >
                        {timeZoneOptions.map((option) => (
                            <Option
                                key={option.value}
                                value={option.value}
                                title={option.label}
                                optionWrapperClassName="px-2"
                            >
                                {option.formattedText}
                            </Option>
                        ))}
                    </SearchableSelect>
                )}
            </div>
        </div>
    );
};
