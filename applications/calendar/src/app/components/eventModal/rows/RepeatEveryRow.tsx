import { c, msgid } from 'ttag';

import { IntegerInput, Option, SelectTwo } from '@proton/components';
import { FREQUENCY, FREQUENCY_INTERVALS_MAX } from '@proton/shared/lib/calendar/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { DateTimeModel, EventModelErrors, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';

import SelectMonthlyType from '../inputs/SelectMonthlyType';
import RepeatOnRow from './RepeatOnRow';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    weekStartsOn: WeekStartsOn;
    onChange: (value: FrequencyModel) => void;
    errors: EventModelErrors;
    isSubmitted: boolean;
}

const getMaxFrequencyInterval = (frequency: FREQUENCY) => {
    return FREQUENCY_INTERVALS_MAX[frequency];
};

const RepeatEveryRow = ({ frequencyModel, start, weekStartsOn, onChange, errors, isSubmitted }: Props) => {
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
        <div className="flex flex-column md:flex-row">
            <div className="md:flex-item-fluid">
                <label htmlFor="event-custom-frequency-number">{c('Label').t`Repeat every`}</label>
                <div className="flex flex-column md:flex-row my-2">
                    <div className="flex flex-nowrap md:flex-item-fluid">
                        <span className="w-custom" style={{ '--w-custom': '6em' }}>
                            <IntegerInput
                                id="event-custom-frequency-number"
                                data-testid="event-modal/custom-frequency/interval:input"
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
                                title={c('Title').t`Choose how often this event repeats`}
                            />
                        </span>
                        <span className="flex-item-fluid ml-2">
                            <SelectTwo
                                id="event-custom-frequency-select"
                                data-testid="event-modal/custom-frequency/interval:frequency"
                                value={frequencyModel.frequency}
                                onChange={({ value }) => handleChangeFrequency(value as FREQUENCY)}
                                title={c('Title').t`Select event frequency interval`}
                            >
                                {intervalOptions.map(({ text, value }) => (
                                    <Option key={value} value={value} title={text} />
                                ))}
                            </SelectTwo>
                        </span>
                    </div>
                    {isMonthly && (
                        <div className="md:flex-item-fluid ml-0 mt-2 md:ml-2 md:mt-0">
                            <SelectMonthlyType
                                id="event-custom-monthly-select"
                                value={frequencyModel.monthly.type}
                                date={start.date}
                                onChange={(type) => onChange({ ...frequencyModel, monthly: { type } })}
                                title={c('Title').t`Select a day in the month`}
                            />
                        </div>
                    )}
                </div>
            </div>
            {isWeekly && (
                <RepeatOnRow
                    frequencyModel={frequencyModel}
                    start={start}
                    weekStartsOn={weekStartsOn}
                    onChange={onChange}
                />
            )}
        </div>
    );
};

export default RepeatEveryRow;
