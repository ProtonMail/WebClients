import React from 'react';
import { c } from 'ttag';

import { SettingsParagraph } from '../../account';

import DateField from './fields/DateField';
import TimeField from './fields/TimeField';
import TimeZoneField from './fields/TimeZoneField';

import { AutoReplyFormModel } from './interfaces';

interface Props {
    model: AutoReplyFormModel;
    updateModel: (key: string) => (value: any) => void;
}

const AutoReplyFormFixed = ({ model: { start, end, timezone }, updateModel }: Props) => {
    return (
        <>
            <SettingsParagraph>
                {c('Info').t`Auto-reply is active from the start time to the end time.`}
            </SettingsParagraph>
            <DateField
                id="startDate"
                label={c('Label').t`Start date`}
                value={start.date}
                max={end.date}
                onChange={updateModel('start.date')}
            />
            <TimeField
                value={start.time}
                onChange={updateModel('start.time')}
                label={c('Label').t`Start time`}
                id="startTime"
            />
            <DateField
                id="endDate"
                label={c('Label').t`End date`}
                value={end.date}
                min={start.date}
                onChange={updateModel('end.date')}
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

export default AutoReplyFormFixed;
