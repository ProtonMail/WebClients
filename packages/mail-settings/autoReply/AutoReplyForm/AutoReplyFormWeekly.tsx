import { c } from 'ttag';

import DayOfWeekField from './fields/DayOfWeekField';
import TimeField from './fields/TimeField';
import TimeZoneField from './fields/TimeZoneField';
import type { AutoReplyFormModel } from './interfaces';

interface Props {
    model: AutoReplyFormModel;
    updateModel: (key: string) => (value: any) => void;
}

const AutoReplyFormWeekly = ({ model: { start, end, timezone }, updateModel }: Props) => {
    return (
        <div className="grid md:grid-cols-2 gap-4">
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
            <div className="md:grid-col-span-2">
                <TimeZoneField value={timezone} onChange={updateModel('timezone')} />
            </div>
        </div>
    );
};

export default AutoReplyFormWeekly;
