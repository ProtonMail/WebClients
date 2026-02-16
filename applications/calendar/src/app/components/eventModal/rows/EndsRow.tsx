import { type ReactNode, useState } from 'react';

import { isValid } from 'date-fns';
import { c, msgid } from 'ttag';

import DateInput from '@proton/components/components/input/DateInput';
import IntegerInput from '@proton/components/components/input/IntegerInput';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import { END_TYPE, FREQUENCY_COUNT_MAX, MAXIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { DateTimeModel, EventModelErrors, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import './EndsRow.scss';

export const UNTIL_ID = 'event-occurrence-until';
export const COUNT_ID = 'event-occurrence-count';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    displayWeekNumbers?: boolean;
    weekStartsOn: WeekStartsOn;
    errors: EventModelErrors;
    isSubmitted: boolean;
    onChange: (value: FrequencyModel) => void;
}

const OptionRow = ({ title, input }: { title: string; input: ReactNode }) => {
    return (
        <div className="flex flex-row gap-2 items-center">
            <span className="w-custom" style={{ '--w-custom': '6.5rem' }}>
                {title}
            </span>
            {input}
        </div>
    );
};

const EndsRow = ({ frequencyModel, start, displayWeekNumbers, weekStartsOn, errors, isSubmitted, onChange }: Props) => {
    const handleChangeEndType = (type: END_TYPE) => {
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, type } });
    };
    const handleChangeEndCount = (count: number | undefined) => {
        if (count !== undefined && (count > FREQUENCY_COUNT_MAX || count < 1)) {
            return;
        }
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, count } });
    };
    const handleChangeEndUntil = (until: Date | undefined) => {
        if (!until || !isValid(until)) {
            return;
        }
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, until } });
    };

    const safeCountPlural = frequencyModel.ends.count || 1; // Can get undefined through the input

    const [selectedOption, setSelectedOption] = useState(frequencyModel.ends.type);

    const options = [
        {
            value: END_TYPE.NEVER,
            label: c('Custom frequency option').t`Doesn't end`,
        },
        {
            value: END_TYPE.UNTIL,
            label: (
                <OptionRow
                    title={c('Custom frequency option').t`Ends on`}
                    input={
                        <div className="sm:flex-1 sm:ml-2 w-custom" style={{ '--w-custom': '10rem' }}>
                            <label htmlFor={UNTIL_ID} className="sr-only">{c('Title')
                                .t`Select event's last date`}</label>
                            <DateInput
                                id={UNTIL_ID}
                                value={frequencyModel.ends.until}
                                min={start.date}
                                prefixPlaceholder={false}
                                defaultDate={start.date}
                                onChange={handleChangeEndUntil}
                                onFocus={() => handleChangeEndType(END_TYPE.UNTIL)}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                aria-invalid={isSubmitted && !!errors.until}
                                isSubmitted={isSubmitted}
                                max={MAXIMUM_DATE}
                                disabled={selectedOption !== END_TYPE.UNTIL}
                                title={c('Title').t`Select event's last date`}
                                aria-describedby="label-event-ends event-ends"
                            />
                        </div>
                    }
                />
            ),
        },
        {
            value: END_TYPE.AFTER_N_TIMES,
            label: (
                <OptionRow
                    title={c('Custom frequency option').t`Ends after`}
                    input={
                        <div className="flex flex-nowrap items-center sm:flex-1 sm:ml-2">
                            <div className="max-w-custom" style={{ '--max-w-custom': '6em' }}>
                                <label htmlFor={COUNT_ID} className="sr-only">{c('Title')
                                    .t`Choose how many times this event will repeat`}</label>
                                <IntegerInput
                                    id={COUNT_ID}
                                    value={frequencyModel.ends.count}
                                    min={1}
                                    onChange={handleChangeEndCount}
                                    onFocus={() => handleChangeEndType(END_TYPE.AFTER_N_TIMES)}
                                    onBlur={() => {
                                        if (!frequencyModel.ends.count) {
                                            handleChangeEndCount(1);
                                        }
                                    }}
                                    aria-invalid={isSubmitted && !!errors.count}
                                    isSubmitted={isSubmitted}
                                    disabled={selectedOption !== END_TYPE.AFTER_N_TIMES}
                                    title={c('Title').t`Choose how many times this event will repeat`}
                                />
                            </div>
                            <div
                                className={clsx(
                                    'shrink-0 ml-2',
                                    selectedOption !== END_TYPE.AFTER_N_TIMES && 'color-disabled'
                                )}
                            >
                                {c('Custom frequency option').ngettext(msgid`event`, `events`, safeCountPlural)}
                            </div>
                        </div>
                    }
                />
            ),
        },
    ];

    return (
        <div className="custom-frequency-ends-row flex flex-row flex-1">
            <div className="flex flex-column gap-2">
                <RadioGroup
                    name="selected-end-type"
                    className="mb-0 mr-0 flex-nowrap self-start"
                    onChange={(v) => {
                        handleChangeEndType(v);
                        setSelectedOption(v);
                    }}
                    value={selectedOption}
                    options={options.map((option) => ({ value: option.value, label: option.label }))}
                />
            </div>
        </div>
    );
};

export default EndsRow;
