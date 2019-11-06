import { c } from 'ttag';
import React from 'react';
import PropTypes from 'prop-types';

import Alert from '../../../components/alert/Alert';
import TimeZoneField from './fields/TimeZoneField';
import DayOfWeekField from './fields/DayOfWeekField';
import TimeField from './fields/TimeField';
import { modelShape } from './autoReplyShapes';

const AutoReplyFormWeekly = ({ model: { start, end, timezone }, updateModel }) => {
    return (
        <>
            <Alert>{c('Info').t`Auto-reply is active each week between the selected start and end time.`}</Alert>
            <DayOfWeekField
                value={start.day}
                onChange={updateModel('start.day')}
                id="startDayOfWeek"
                label={c('Label').t`Start weekday`}
            />
            <TimeField
                value={start.time}
                onChange={updateModel('start.time')}
                label={c('Label').t`Start time`}
                id="startTime"
            />
            <DayOfWeekField
                value={end.day}
                onChange={updateModel('end.day')}
                id="endDayOfWeek"
                label={c('Label').t`End weekday`}
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

AutoReplyFormWeekly.propTypes = {
    model: modelShape,
    updateModel: PropTypes.func
};

export default AutoReplyFormWeekly;
