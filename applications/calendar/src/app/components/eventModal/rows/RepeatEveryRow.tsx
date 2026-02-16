import { c, msgid } from 'ttag';

import IntegerInput from '@proton/components/components/input/IntegerInput';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { FREQUENCY, FREQUENCY_INTERVALS_MAX } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { DateTimeModel, EventModelErrors, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import SelectMonthlyType from '../inputs/SelectMonthlyType';
import RepeatOnRow from './RepeatOnRow';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    weekStartsOn: WeekStartsOn;
    onChange: (value: FrequencyModel) => void;
    errors: EventModelErrors;
    isSubmitted: boolean;
    displayStacked?: boolean;
}

const getMaxFrequencyInterval = (frequency: FREQUENCY) => {
    return FREQUENCY_INTERVALS_MAX[frequency];
};

const RepeatEveryRow = ({
    frequencyModel,
    start,
    weekStartsOn,
    onChange,
    errors,
    isSubmitted,
    displayStacked = false,
}: Props) => {
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
        <div className={clsx('flex flex-column *:min-size-auto gap-3')}>
            <div className="md:flex-1">
                <div className="flex flex-column md:flex-row">
                    <div
                        className={clsx(
                            'flex flex-nowrap md:flex-1',
                            displayStacked ? 'flex-column items-start gap-2' : 'items-center'
                        )}
                    >
                        <label
                            className="color-weak w-custom mr-2"
                            style={{ '--w-custom': '4.25rem' }}
                            htmlFor="event-custom-frequency-number"
                            id="label-event-custom-frequency"
                        >{c('Label').t`Every`}</label>
                        <span className="w-custom" style={{ '--w-custom': '3.5rem' }}>
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
                                aria-describedby="label-event-custom-frequency event-custom-frequency-select"
                            />
                        </span>
                        <span className={clsx('w-custom', !displayStacked && 'ml-2')} style={{ '--w-custom': '8rem' }}>
                            <SelectTwo
                                id="event-custom-frequency-select"
                                data-testid="event-modal/custom-frequency/interval:frequency"
                                value={frequencyModel.frequency}
                                onChange={({ value }) => handleChangeFrequency(value as FREQUENCY)}
                                title={c('Title').t`Select event frequency interval`}
                                aria-describedby="label-event-custom-frequency event-custom-frequency-number event-custom-frequency-select"
                            >
                                {intervalOptions.map(({ text, value }) => (
                                    <Option key={value} value={value} title={text} />
                                ))}
                            </SelectTwo>
                        </span>
                    </div>
                </div>
            </div>
            {isMonthly && (
                <SelectMonthlyType
                    value={frequencyModel.monthly.type}
                    date={start.date}
                    onChange={(type) => onChange({ ...frequencyModel, monthly: { type } })}
                />
            )}
            {isWeekly && (
                <RepeatOnRow
                    frequencyModel={frequencyModel}
                    start={start}
                    weekStartsOn={weekStartsOn}
                    onChange={onChange}
                    displayStacked={displayStacked}
                />
            )}
        </div>
    );
};

export default RepeatEveryRow;
