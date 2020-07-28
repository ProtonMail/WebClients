import React, { ChangeEvent } from 'react';
import { c, msgid } from 'ttag';
import { Select, IntegerInput, classnames } from 'react-components';

import { FREQUENCY, FREQUENCY_INTERVALS_MAX } from '../../../constants';

import SelectMonthlyType from '../inputs/SelectMonthlyType';
import { DateTimeModel, EventModelErrors, FrequencyModel } from '../../../interfaces/EventModel';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    onChange: (value: FrequencyModel) => void;
    errors: EventModelErrors;
    isSubmitted: boolean;
}

const getMaxFrequencyInterval = (frequency: FREQUENCY) => {
    return FREQUENCY_INTERVALS_MAX[frequency];
};

const RepeatEveryRow = ({ frequencyModel, start, onChange, errors, isSubmitted }: Props) => {
    const isMonthly = frequencyModel.frequency === FREQUENCY.MONTHLY;
    const isWeekly = frequencyModel.frequency === FREQUENCY.WEEKLY;
    const safeIntervalPlural = frequencyModel.interval || 1; // Can get undefined through the input
    const intervalOptions = [
        { text: c('Option').ngettext(msgid`Day`, `Days`, safeIntervalPlural), value: FREQUENCY.DAILY },
        { text: c('Option').ngettext(msgid`Week`, `Weeks`, safeIntervalPlural), value: FREQUENCY.WEEKLY },
        { text: c('Option').ngettext(msgid`Month`, `Months`, safeIntervalPlural), value: FREQUENCY.MONTHLY },
        { text: c('Option').ngettext(msgid`Year`, `Years`, safeIntervalPlural), value: FREQUENCY.YEARLY },
    ];

    const handleChangeInterval = (interval: number | undefined) => {
        if (interval !== undefined && (interval > getMaxFrequencyInterval(frequencyModel.frequency) || interval < 1)) {
            return;
        }
        onChange({ ...frequencyModel, interval });
    };
    const handleChangeFrequency = (frequency: FREQUENCY) => {
        const newMaxInterval = getMaxFrequencyInterval(frequency);
        const interval = Math.min(frequencyModel.interval || 0, newMaxInterval);
        onChange({ ...frequencyModel, frequency, interval });
    };

    return (
        <div className={classnames(['flex flex-column flex-items-start mb0-5 mr1', isWeekly && 'w45'])}>
            <label htmlFor="event-custom-frequency-select">{c('Label').t`Repeat every`}</label>
            <div className="flex flex-nowrap mt0-5">
                <div className="flex flex-item-fluid">
                    <IntegerInput
                        data-test-id="event-modal/custom-frequency/interval:input"
                        min={1}
                        value={frequencyModel.interval}
                        onChange={handleChangeInterval}
                        onBlur={() => {
                            if (!frequencyModel.interval) {
                                handleChangeInterval(1);
                            }
                        }}
                        aria-invalid={isSubmitted && !!errors.interval}
                        isSubmitted={isSubmitted}
                    />
                </div>
                <div className="flex flex-item-grow-2">
                    <Select
                        className="ml0-5"
                        id="event-custom-frequency-select"
                        data-test-id="event-modal/custom-frequency/interval:frequency"
                        value={frequencyModel.frequency}
                        options={intervalOptions}
                        onChange={({ target }: ChangeEvent<HTMLSelectElement>) =>
                            handleChangeFrequency(target.value as FREQUENCY)
                        }
                    />
                </div>
                {isMonthly && (
                    <div className="flex">
                        <SelectMonthlyType
                            id="event-custom-monthly-select"
                            value={frequencyModel.monthly.type}
                            date={start.date}
                            onChange={(type) => onChange({ ...frequencyModel, monthly: { type } })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepeatEveryRow;
