import React from 'react';
import { c, msgid } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Select } from 'react-components';

import { FREQUENCY, FREQUENCY_INTERVALS_MAX } from '../../../constants';

import IntegerInput from '../inputs/IntegerInput';

const RepeatEveryRow = ({ frequencyModel, onChange, errors, isSubmitted, collapseOnMobile }) => {
    const safeIntervalPlural = frequencyModel.ends.interval || 1; // Can get undefined through the input
    const intervalOptions = [
        { text: c('Option').ngettext(msgid`Day`, `Days`, safeIntervalPlural), value: FREQUENCY.DAILY },
        { text: c('Option').ngettext(msgid`Week`, `Weeks`, safeIntervalPlural), value: FREQUENCY.WEEKLY },
        // { text: c('Option').ngettext(msgid`Month`, `Months`, safeIntervalPlural), value: FREQUENCY.MONTHLY },
        { text: c('Option').ngettext(msgid`Year`, `Years`, safeIntervalPlural), value: FREQUENCY.YEARLY }
    ];

    const handleChangeInterval = (interval) => {
        if (interval !== '' && (interval > FREQUENCY_INTERVALS_MAX[frequencyModel.frequency] || interval < 1)) {
            return;
        }
        onChange({ ...frequencyModel, interval });
    };
    const handleChangeFrequency = (frequency) => onChange({ ...frequencyModel, frequency });

    return (
        <>
            <Row collapseOnMobile={collapseOnMobile}>
                <label htmlFor="event-custom-frequency-select">{c('Label').t`Repeat every`}</label>
            </Row>
            <Row>
                <div className="flex flex-nowrap flex-item-fluid">
                    <IntegerInput
                        className="mr1 w20"
                        min={1}
                        value={frequencyModel.interval}
                        onChange={handleChangeInterval}
                        aria-invalid={isSubmitted && !!errors.interval}
                        isSubmitted={isSubmitted}
                    />
                    <Select
                        id="event-custom-frequency-select"
                        value={frequencyModel.frequency}
                        options={intervalOptions}
                        onChange={({ target }) => handleChangeFrequency(target.value)}
                    />
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
