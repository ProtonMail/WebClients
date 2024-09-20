import { c } from 'ttag';

import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';

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
        <>
            <SettingsParagraph>
                {c('Info')
                    .t`Auto-reply is always active on the days of the week you select, between the selected hours.`}
            </SettingsParagraph>
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

export default AutoReplyFormDaily;
