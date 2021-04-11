import { END_TYPE, FREQUENCY_COUNT_MAX, MAXIMUM_DATE } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/date-fns-utc/interface';
import React from 'react';
import { c, msgid } from 'ttag';
import { DateInput, IntegerInput, SelectTwo, Option } from 'react-components';
import { isValid } from 'date-fns';

import { DateTimeModel, FrequencyModel, EventModelErrors } from 'proton-shared/lib/interfaces/calendar';

const { NEVER, UNTIL, AFTER_N_TIMES } = END_TYPE;

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

    const options = [
        {
            value: NEVER,
            text: c('Custom frequency option').t`Never`,
        },
        {
            value: UNTIL,
            text: c('Custom frequency option').t`On date…`,
        },
        {
            value: AFTER_N_TIMES,
            text: c('Custom frequency option').t`After repeating…`,
        },
    ];

    return (
        <div className="flex-item-fluid">
            <label htmlFor="event-ends-radio">{c('Label').t`Ends`}</label>

            <div className="flex flex-nowrap flex-item-fluid on-tiny-mobile-flex-column">
                <div className="flex-item-fluid mt0-5">
                    <SelectTwo
                        value={frequencyModel.ends.type}
                        onChange={({ value }) => {
                            const newValue = value as END_TYPE;
                            handleChangeEndType?.(newValue);
                        }}
                        title={c('Title').t`Select when this event will stop happening`}
                    >
                        {options.map(({ value, text }) => (
                            <Option key={value} value={value} title={text} />
                        ))}
                    </SelectTwo>
                </div>

                {frequencyModel.ends.type === UNTIL && (
                    <div className="flex-item-fluid mt0-5 ml0-5 on-tiny-mobile-ml0">
                        <DateInput
                            id={UNTIL_ID}
                            value={frequencyModel.ends.until}
                            min={start.date}
                            defaultDate={start.date}
                            onChange={handleChangeEndUntil}
                            onFocus={() => handleChangeEndType(UNTIL)}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            aria-invalid={isSubmitted && !!errors.until}
                            isSubmitted={isSubmitted}
                            max={MAXIMUM_DATE}
                            title={c('Title').t`Select event's last date`}
                        />
                    </div>
                )}

                {frequencyModel.ends.type === AFTER_N_TIMES && (
                    <div className="flex flex-nowrap flex-align-items-center flex-item-fluid mt0-5 ml0-5 on-tiny-mobile-ml0">
                        <div className="flex-item-fluid max-w5e">
                            <IntegerInput
                                id={COUNT_ID}
                                value={frequencyModel.ends.count}
                                min={1}
                                onChange={handleChangeEndCount}
                                onFocus={() => handleChangeEndType(AFTER_N_TIMES)}
                                onBlur={() => {
                                    if (!frequencyModel.ends.count) {
                                        handleChangeEndCount(1);
                                    }
                                }}
                                aria-invalid={isSubmitted && !!errors.count}
                                isSubmitted={isSubmitted}
                                title={c('Title').t`Choose how many times this event will repeat`}
                            />
                        </div>
                        <div className="flex-item-flex-item-noshrink ml0-5">
                            {c('Custom frequency option').ngettext(msgid`time`, `times`, safeCountPlural)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EndsRow;
