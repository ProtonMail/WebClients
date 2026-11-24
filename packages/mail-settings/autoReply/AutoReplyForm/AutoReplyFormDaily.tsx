import { c } from 'ttag';

import DaysOfWeekField from './fields/DaysOfWeekField';
import TimeField from './fields/TimeField';
import TimeZoneField from './fields/TimeZoneField';
import type { AutoReplyFormModel } from './interfaces';

interface Props {
    model: AutoReplyFormModel;
    updateModel: (key: string) => (value: any) => void;
}

const AutoReplyFormDaily = ({ model: { daysOfWeek, start, end, timezone }, updateModel }: Props) => {
    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="md:grid-col-span-2">
                <DaysOfWeekField value={daysOfWeek} onChange={updateModel('daysOfWeek')} />
            </div>
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
            <div className="md:grid-col-span-2">
                <TimeZoneField value={timezone} onChange={updateModel('timezone')} />
            </div>
        </div>
    );
};

export default AutoReplyFormDaily;
