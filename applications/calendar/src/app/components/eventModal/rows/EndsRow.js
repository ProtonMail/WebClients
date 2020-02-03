import React from 'react';
import { c, msgid } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Radio, DateInput } from 'react-components';
import { isValid } from 'date-fns';

import { END_TYPE, FREQUENCY_COUNT_MAX } from '../../../constants';

import IntegerInput from '../inputs/IntegerInput';

const { NEVER, UNTIL, AFTER_N_TIMES } = END_TYPE;

const EndsRow = ({
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    isSubmitted,
    onChange,
    collapseOnMobile
}) => {
    const handleChangeEndType = (type) => {
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, type } });
    };
    const handleChangeEndCount = (count) => {
        if (count !== '' && (count > FREQUENCY_COUNT_MAX[frequencyModel.frequency] || count < 1)) {
            return;
        }
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, count } });
    };
    const handleChangeEndUntil = (until) => {
        if (!isValid(until)) {
            return;
        }
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, until } });
    };

    const safeCountPlural = frequencyModel.ends.count || 1; // Can get undefined through the input

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <label htmlFor="event-ends-radio">{c('Label').t`Ends`}</label>
            </Row>
            <div className="calendar-recurringFrequencyEnd-grid">
                <div className="flex flex-nowrap flex-item-fluid calendar-recurringFrequencyEnd-grid-fullLine">
                    <span className="flex flex-item-noshrink">
                        <Radio
                            name="event-ends-radio"
                            checked={frequencyModel.ends.type === NEVER}
                            onChange={() => handleChangeEndType(NEVER)}
                        >
                            {c('Custom frequency option').t`Never`}
                        </Radio>
                    </span>
                </div>

                <span className="flex flex-item-noshrink">
                    <Radio
                        className="mr1 flex-nowrap mtauto mbauto"
                        name="event-ends-radio"
                        checked={frequencyModel.ends.type === UNTIL}
                        onChange={() => handleChangeEndType(UNTIL)}
                    >
                        {c('Custom frequency option').t`On`}
                    </Radio>
                </span>
                <span>
                    <DateInput
                        value={frequencyModel.ends.until}
                        min={start.date}
                        defaultDate={start.date}
                        onChange={handleChangeEndUntil}
                        onFocus={() => handleChangeEndType(UNTIL)}
                        displayWeekNumbers={displayWeekNumbers}
                        weekStartsOn={weekStartsOn}
                        aria-invalid={isSubmitted && !!errors.until}
                        isSubmitted={isSubmitted}
                    />
                </span>
                <span></span>

                <span className="flex flex-item-noshrink">
                    <Radio
                        className="mr1 flex-nowrap mtauto mbauto"
                        name="event-ends-radio"
                        checked={frequencyModel.ends.type === AFTER_N_TIMES}
                        onChange={() => handleChangeEndType(AFTER_N_TIMES)}
                    >
                        {c('Custom frequency option').t`After`}
                    </Radio>
                </span>
                <span>
                    <IntegerInput
                        value={frequencyModel.ends.count}
                        min={1}
                        onChange={handleChangeEndCount}
                        onFocus={() => handleChangeEndType(AFTER_N_TIMES)}
                        aria-invalid={isSubmitted && !!errors.count}
                        isSubmitted={isSubmitted}
                    />
                </span>
                <span className="mtauto mbauto">
                    {c('Custom frequency option').ngettext(msgid`Occurrence`, `Occurrences`, safeCountPlural)}
                </span>
            </div>
        </>
    );
};

EndsRow.propTypes = {
    frequencyModel: PropTypes.object,
    start: PropTypes.object,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number,
    errors: PropTypes.object,
    isSubmitted: PropTypes.bool,
    onChange: PropTypes.func,
    collapseOnMobile: PropTypes.bool
};

export default EndsRow;
