import { isValid } from 'date-fns';
import { c, msgid } from 'ttag';

import { DateInput, IntegerInput, Option, SelectTwo } from '@proton/components';
import { END_TYPE, FREQUENCY_COUNT_MAX, MAXIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { DateTimeModel, EventModelErrors, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

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
    displayStacked?: boolean;
}
const EndsRow = ({
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    isSubmitted,
    onChange,
    displayStacked = false,
}: Props) => {
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
        <div className={clsx('flex-1', displayStacked && 'mt-4')}>
            <label
                className={clsx(displayStacked && 'text-semibold')}
                htmlFor="event-ends-radio"
                id="label-event-ends"
            >{c('Label').t`Ends`}</label>

            <div className="flex flex-nowrap flex-1 flex-column sm:flex-row">
                <div className="sm:flex-1 mt-2">
                    <SelectTwo
                        value={frequencyModel.ends.type}
                        onChange={({ value }) => {
                            const newValue = value as END_TYPE;
                            handleChangeEndType?.(newValue);
                        }}
                        title={c('Title').t`Select when this event will stop happening`}
                        aria-describedby="label-event-ends"
                        id="event-ends"
                    >
                        {options.map(({ value, text }) => (
                            <Option key={value} value={value} title={text} />
                        ))}
                    </SelectTwo>
                </div>

                {frequencyModel.ends.type === UNTIL && (
                    <div className="sm:flex-1 mt-2 ml-0 sm:ml-2">
                        <label htmlFor={UNTIL_ID} className="sr-only">{c('Title').t`Select event's last date`}</label>
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
                            aria-describedby="label-event-ends event-ends"
                        />
                    </div>
                )}

                {frequencyModel.ends.type === AFTER_N_TIMES && (
                    <div className="flex flex-nowrap items-center sm:flex-1 mt-2 ml-0 sm:ml-2">
                        <div className="max-w-custom" style={{ '--max-w-custom': '6em' }}>
                            <label htmlFor={COUNT_ID} className="sr-only">{c('Title')
                                .t`Choose how many times this event will repeat`}</label>
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
                        <div className="shrink-0 ml-2">
                            {c('Custom frequency option').ngettext(msgid`time`, `times`, safeCountPlural)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EndsRow;
