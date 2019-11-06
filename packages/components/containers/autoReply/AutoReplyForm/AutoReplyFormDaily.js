import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import Alert from '../../../components/alert/Alert';
import DaysOfWeekField from './fields/DaysOfWeekField';
import TimeZoneField from './fields/TimeZoneField';
import TimeField from './fields/TimeField';
import { modelShape } from './autoReplyShapes';

const AutoReplyFormDaily = ({ model: { daysOfWeek, start, end, timezone }, updateModel }) => {
    return (
        <>
            <Alert>{c('Info')
                .t`Auto-reply is always active on the days of the week you select, between the selected hours.`}</Alert>
            <DaysOfWeekField value={daysOfWeek} onChange={updateModel('daysOfWeek')} />
            <TimeField
                value={start.time}
                onChange={updateModel('start.time')}
                label={c('Label').t`Start time`}
                id="startTime"
            />
            <TimeField
                value={end.time}
                onChange={updateModel('end.time')}
                label={c('Label').t`End time`}
                id="endTime"
            />
            <TimeZoneField value={timezone} onChange={updateModel('timezone')} />
        </>
    );
};

AutoReplyFormDaily.propTypes = {
    model: modelShape,
    updateModel: PropTypes.func
};

export default AutoReplyFormDaily;
