import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row } from 'react-components';
import AllDayCheckbox from './inputs/AllDayCheckbox';
import FrequencyRow from './rows/FrequencyRow';

const AlarmForm = ({ model, setModel }) => {
    return (
        <>
            <FrequencyRow
                label={c('Label').t`Frequency`}
                value={model.frequency}
                onChange={(frequency) => setModel({ ...model, frequency })}
            />
            <Row>
                <AllDayCheckbox checked={model.isAllDay} onChange={(isAllDay) => setModel({ ...model, isAllDay })}/>
            </Row>
        </>
    );
};

AlarmForm.propTypes = {
    model: PropTypes.object,
    setModel: PropTypes.func
};

export default AlarmForm;
