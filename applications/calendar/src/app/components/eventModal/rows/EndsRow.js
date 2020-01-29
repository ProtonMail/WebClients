import React from 'react';
import { c } from 'ttag';
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
    error,
    isSubmitted,
    onChange,
    collapseOnMobile
}) => {
    const maxCountValue = FREQUENCY_COUNT_MAX[frequencyModel.frequency];
    const countValue = Math.min((frequencyModel.ends && frequencyModel.ends.count) || 2, maxCountValue);

    const handleChangeEndType = (type) => {
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, type } });
    };
    const handleChangeEndCount = (count) => {
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, count } });
    };
    const handleChangeEndUntil = (until) => {
        if (!isValid(until)) {
            return;
        }
        onChange({ ...frequencyModel, ends: { ...frequencyModel.ends, until } });
    };

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <label htmlFor="event-ends-radio">{c('Label').t`Ends`}</label>
            </Row>
            <Row collapseOnMobile={collapseOnMobile}>
                <div className="flex flex-nowrap flex-item-fluid">
                    <Radio
                        name="event-ends-radio"
                        checked={frequencyModel.ends.type === NEVER}
                        onChange={() => handleChangeEndType(NEVER)}
                    >
                        {c('Custom frequency option').t`Never`}
                    </Radio>
                </div>
            </Row>
            <Row collapseOnMobile={collapseOnMobile}>
                <div className="flex flex-nowrap flex-item-fluid">
                    <Radio
                        className="mr1 flex-no-wrap mtauto mbauto"
                        name="event-ends-radio"
                        checked={frequencyModel.ends.type === UNTIL}
                        onChange={() => handleChangeEndType(UNTIL)}
                    >
                        {c('Custom frequency option').t`On`}
                    </Radio>
                    <span>
                        <DateInput
                            value={frequencyModel.ends.until}
                            min={start.date}
                            defaultDate={start.date}
                            onChange={handleChangeEndUntil}
                            onFocus={() => handleChangeEndType(UNTIL)}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            aria-invalid={isSubmitted && !!error}
                            isSubmitted={isSubmitted}
                        />
                    </span>
                </div>
            </Row>
            <Row collapseOnMobile={collapseOnMobile}>
                <div className="flex flex-nowrap flex-item-fluid">
                    <Radio
                        className="mr1 flex-no-wrap mtauto mbauto"
                        name="event-ends-radio"
                        checked={frequencyModel.ends.type === AFTER_N_TIMES}
                        onChange={() => handleChangeEndType(AFTER_N_TIMES)}
                    >
                        {c('Custom frequency option').t`After`}
                    </Radio>
                    <span className="mr1">
                        <IntegerInput
                            value={frequencyModel.ends.count === '' ? '' : countValue}
                            min="2"
                            max={maxCountValue}
                            onChange={handleChangeEndCount}
                            onFocus={() => handleChangeEndType(AFTER_N_TIMES)}
                            onBlur={() => {
                                if (countValue === '') {
                                    handleChangeEndCount(2);
                                }
                            }}
                        />
                    </span>
                    <span className="mtauto mbauto">{c('Custom frequency option').t`Occurrences`}</span>
                </div>
            </Row>
        </>
    );
};

EndsRow.propTypes = {
    frequencyModel: PropTypes.object,
    start: PropTypes.object,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number,
    error: PropTypes.string,
    isSubmitted: PropTypes.bool,
    onChange: PropTypes.func,
    collapseOnMobile: PropTypes.bool
};

export default EndsRow;
