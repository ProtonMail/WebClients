import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row } from 'react-components';

import AllDayCheckbox from './inputs/AllDayCheckbox';
import FrequencyRow from './rows/FrequencyRow';
import DescriptionRow from './rows/DescriptionRow';

const TaskForm = ({ model, setModel }) => {
    return (
        <>
            <FrequencyRow
                label={c('Label').t`Frequency`}
                value={model.frequency}
                onChange={(frequency) => setModel({ ...model, frequency })}
            />
            <Row>
                <AllDayCheckbox checked={model.isAllDay} onChange={(isAllDay) => setModel({ ...model, isAllDay })} />
            </Row>
            <DescriptionRow
                label={c('Label').t`Description`}
                value={model.description}
                onChange={(description) => setModel({ ...model, description })}
            />
        </>
    );
};

TaskForm.propTypes = {
    model: PropTypes.object,
    setModel: PropTypes.func
};

export default TaskForm;
