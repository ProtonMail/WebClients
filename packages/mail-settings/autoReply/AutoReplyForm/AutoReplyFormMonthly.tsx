import { c } from 'ttag';

import DayOfMonthField from './fields/DayOfMonthField';
import TimeField from './fields/TimeField';
import TimeZoneField from './fields/TimeZoneField';
import type { AutoReplyFormModel } from './interfaces';

interface Props {
    model: AutoReplyFormModel;
    updateModel: (key: string) => (value: any) => void;
}

const AutoReplyFormMonthly = ({ model: { start, end, timezone }, updateModel }: Props) => {
    return (
        <div className="grid md:grid-cols-2 gap-4">
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
            <div className="md:grid-col-span-2">
                <TimeZoneField value={timezone} onChange={updateModel('timezone')} />
            </div>
        </div>
    );
};

export default AutoReplyFormMonthly;
