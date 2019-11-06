import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';

import DayOfMonthField from './fields/DayOfMonthField';
import TimeZoneField from './fields/TimeZoneField';
import Alert from '../../../components/alert/Alert';
import TimeField from './fields/TimeField';
import { modelShape } from './autoReplyShapes';

const AutoReplyFormMonthly = ({ model: { start, end, timezone }, updateModel }) => {
    return (
        <>
            <Alert>{c('Info').t`Auto-reply is active each month between the selected start and end time.`}</Alert>
            <DayOfMonthField
                id="startDayOfMonth"
                label={c('Label').t`Start day of month`}
                value={start.day}
                onChange={updateModel('start.day')}
            />
            <TimeField
                value={start.time}
                onChange={updateModel('start.time')}
                label={c('Label').t`Start time`}
                id="startTime"
            />
            <DayOfMonthField
                id="endDayOfMonth"
                label={c('Label').t`End day of month`}
                value={end.day}
                onChange={updateModel('end.day')}
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

AutoReplyFormMonthly.propTypes = {
    model: modelShape,
    updateModel: PropTypes.func
};

export default AutoReplyFormMonthly;
