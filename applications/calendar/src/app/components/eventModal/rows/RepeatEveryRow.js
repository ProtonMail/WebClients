import React from 'react';
import { c, msgid } from 'ttag';
import PropTypes from 'prop-types';
import { Row, Select } from 'react-components';

import { FREQUENCY, FREQUENCY_INTERVALS_MAX } from '../../../constants';

import IntegerInput from '../inputs/IntegerInput';

const RepeatEveryRow = ({ frequencyModel, onChange, collapseOnMobile }) => {
    const intervalOptions = [
        { text: c('Option').ngettext(msgid`Week`, `Weeks`, frequencyModel.interval), value: FREQUENCY.WEEKLY }
        // { text: c('Option').ngettext(msgid`Month`, `Months`, frequencyModel.interval), value: FREQUENCY.MONTHLY },
        // { text: c('Option').ngettext(msgid`Year`, `Years`, frequencyModel.interval), value: FREQUENCY.YEARLY }
    ];
    const maxIntervalValue = FREQUENCY_INTERVALS_MAX[frequencyModel.type];

    const handleChangeInterval = (interval) => onChange({ ...frequencyModel, interval });
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
                        max={maxIntervalValue}
                        value={frequencyModel.interval}
                        onChange={handleChangeInterval}
                        onBlur={() => {
                            if (frequencyModel.interval === '') {
                                handleChangeInterval(1);
                            }
                        }}
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
    collapseOnMobile: PropTypes.bool
};

export default RepeatEveryRow;
