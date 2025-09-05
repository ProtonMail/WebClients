import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import DateInputTwo from '@proton/components/components/v2/input/DateInputTwo';
import { IcClock } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import type { FormValues } from '../containers/CreateContainer/types';
import { TimeInput } from './TimeInput/TimeInput';

export const TimeInputBlock = ({
    name,
    values,
    setValues,
    showTimezones,
    timeOptions,
    timeZoneOptions,
    showIcon = true,
    editableTimeZone = true,
    timeError,
}: {
    name: 'start' | 'end';
    values: FormValues;
    setValues: (values: FormValues) => void;
    showTimezones: boolean;
    timeOptions: { value: string; label: string }[];
    timeZoneOptions: { value: string; label: string }[];
    showIcon?: boolean;
    editableTimeZone?: boolean;
    timeError?: boolean;
}) => {
    const dateInputWidth = showTimezones ? '9.125rem' : '16.375rem';
    const timeInputWidth = showTimezones ? '6.875rem' : '16.375rem';

    return (
        <div className="w-full flex flex-nowrap items-center gap-4">
            <IcClock className={clsx(!showIcon && 'visibility-hidden')} size={5} />
            <DateInputTwo
                id={`${name}Date`}
                name={`${name}Date`}
                min={new Date(Date.now() - 24 * 60 * 60 * 1000)}
                preventValueReset
                onChange={(date) => setValues({ ...values, [`${name}Date`]: date as Date })}
                className="date-input w-custom max-w-custom"
                inputClassName="date-input"
                value={values[`${name}Date`]}
                containerProps={{ style: { '--w-custom': dateInputWidth, '--max-w-custom': dateInputWidth } }}
                dropdownClassName="create-container-dropdown"
            />
            <TimeInput
                id={`${name}Time`}
                name={`${name}Time`}
                rootClassName="w-custom max-w-custom"
                rootStyle={{ '--w-custom': timeInputWidth, '--max-w-custom': timeInputWidth }}
                value={values[`${name}Time`]}
                onChange={(value) => {
                    if (!value.includes(':')) {
                        return;
                    }

                    setValues({ ...values, [`${name}Time`]: value });
                }}
                options={timeOptions}
                error={timeError}
            />
            {showTimezones && (
                <SearchableSelect
                    name="timeZone"
                    className="w-custom max-w-custom"
                    onChange={(item: { value: string }) => {
                        setValues({ ...values, timeZone: item.value as string });
                    }}
                    value={values.timeZone}
                    dropdownClassName="create-container-dropdown p-2"
                    style={{ '--w-custom': '16.25rem', '--max-w-custom': '16.25rem' }}
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
                        <Option key={option.value} value={option.value} title={option.label}>
                            {option.label}
                        </Option>
                    ))}
                </SearchableSelect>
            )}
        </div>
    );
};
