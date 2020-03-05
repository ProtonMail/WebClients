import React from 'react';
import { c, msgid } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Select } from 'react-components';

import { FREQUENCY, FREQUENCY_INTERVALS_MAX } from '../../../constants';

import IntegerInput from '../inputs/IntegerInput';
import SelectMonthlyType from '../inputs/SelectMonthlyType';

const RepeatEveryRow = ({ frequencyModel, start, onChange, errors, isSubmitted, collapseOnMobile }) => {
    const isMonthly = frequencyModel.frequency === FREQUENCY.MONTHLY;
    const safeIntervalPlural = frequencyModel.interval || 1; // Can get undefined through the input
    const intervalOptions = [
        { text: c('Option').ngettext(msgid`Day`, `Days`, safeIntervalPlural), value: FREQUENCY.DAILY },
        { text: c('Option').ngettext(msgid`Week`, `Weeks`, safeIntervalPlural), value: FREQUENCY.WEEKLY },
        { text: c('Option').ngettext(msgid`Month`, `Months`, safeIntervalPlural), value: FREQUENCY.MONTHLY },
        { text: c('Option').ngettext(msgid`Year`, `Years`, safeIntervalPlural), value: FREQUENCY.YEARLY }
    ];

    const handleChangeInterval = (interval) => {
        if (interval !== '' && (interval > FREQUENCY_INTERVALS_MAX[frequencyModel.frequency] || interval < 1)) {
            return;
        }
        onChange({ ...frequencyModel, interval });
    };
    const handleChangeFrequency = (frequency) => {
        const newMaxInterval = FREQUENCY_INTERVALS_MAX[frequency];
        const interval = Math.min(frequencyModel.interval, newMaxInterval);
        onChange({ ...frequencyModel, frequency, interval });
    };
    const handleChangeMonthlyType = (type) => onChange({ ...frequencyModel, monthly: { type: +type } });

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <label htmlFor="event-custom-frequency-select">{c('Label').t`Repeat every`}</label>
            </Row>
            <Row>
                <div className="flex flex-wrap flex-item-fluid onmobile-flex-column onpopover-flex-column">
                    <div className="flex flex-nowrap onmobile-w100 flex-item-fluid mb0-5">
                        <div className="flex-item-fluid">
                            <IntegerInput
                                min={1}
                                value={frequencyModel.interval}
                                onChange={handleChangeInterval}
                                aria-invalid={isSubmitted && !!errors.interval}
                                isSubmitted={isSubmitted}
                            />
                        </div>
                        <div className="w14e" />
                        <div className="flex-item-fluid">
                            <Select
                                id="event-custom-frequency-select"
                                value={frequencyModel.frequency}
                                options={intervalOptions}
                                onChange={({ target }) => handleChangeFrequency(target.value)}
                            />
                        </div>
                    </div>
                    {isMonthly && (
                        <div className="flex flex-item-fluid onmobile-w100 mb0-5">
                            <div className="w14e nomobile noInEventPopover" />
                            <div className="flex flex-item-fluid">
                                <SelectMonthlyType
                                    id="event-custom-monthly-select"
                                    value={frequencyModel.monthly.type}
                                    date={start.date}
                                    onChange={({ target }) => handleChangeMonthlyType(target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Row>
        </>
    );
};

RepeatEveryRow.propTypes = {
    frequencyModel: PropTypes.object,
    onChange: PropTypes.func,
    errors: PropTypes.object,
    isSubmitted: PropTypes.bool,
    collapseOnMobile: PropTypes.bool
};

export default RepeatEveryRow;
