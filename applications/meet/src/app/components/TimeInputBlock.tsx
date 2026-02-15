import type { ReactNode } from 'react';

import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import DateInputTwo from '@proton/components/components/v2/input/DateInputTwo';
import { IcClock } from '@proton/icons/icons/IcClock';
import type { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { FormValues } from './ScheduleMeetingForm/types';
import { TimeInput } from './TimeInput/TimeInput';

export const TimeInputBlock = ({
    name,
    values,
    setValues,
    showTimezones,
    timeOptions,
    timeZoneOptions,
    timeFormat,
    showIcon = true,
    editableTimeZone = true,
    timeError,
}: {
    name: 'start' | 'end';
    values: FormValues;
    setValues: (values: FormValues) => void;
    showTimezones: boolean;
    timeOptions: { value: string; label: string }[];
    timeZoneOptions: { value: string; label: string; formattedText: ReactNode }[];
    timeFormat: SETTINGS_TIME_FORMAT;
    showIcon?: boolean;
    editableTimeZone?: boolean;
    timeError?: boolean;
}) => {
    return (
        <div className="w-full flex flex-nowrap items-center gap-4">
            <IcClock
                className={clsx('shrink-0', !showIcon && 'visibility-hidden')}
                size={5}
                style={{ color: 'var(--interaction-weak-major-3)' }}
            />
            <div className="flex-1 flex flex-column *:min-size-auto md:flex-row flex-nowrap items-center gap-2">
                <div
                    className={clsx('flex-1 flex flex-nowrap items-center gap-2 ', showTimezones && 'grow-custom')}
                    style={{ '--grow-custom': '1.25' }}
                >
                    <DateInputTwo
                        id={`${name}Date`}
                        name={`${name}Date`}
                        min={new Date(Date.now() - 24 * 60 * 60 * 1000)}
                        preventValueReset
                        onChange={(date) => setValues({ ...values, [`${name}Date`]: date as Date })}
                        className="date-input flex-1"
                        inputClassName="date-input"
                        value={values[`${name}Date`]}
                        dropdownClassName="create-container-dropdown"
                    />
                    <TimeInput
                        id={`${name}Time`}
                        name={`${name}Time`}
                        value={values[`${name}Time`]}
                        onChange={(value) => {
                            if (!value.includes(':')) {
                                return;
                            }

                            setValues({ ...values, [`${name}Time`]: value });
                        }}
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
                            setValues({ ...values, timeZone: item.value as string });
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
