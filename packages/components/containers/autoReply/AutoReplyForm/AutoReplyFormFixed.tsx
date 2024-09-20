import { c } from 'ttag';

import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';

import DateField from './fields/DateField';
import TimeField from './fields/TimeField';
import TimeZoneField from './fields/TimeZoneField';
import type { AutoReplyFormModel } from './interfaces';

interface Props {
    model: AutoReplyFormModel;
    updateModel: (key: string) => (value: any) => void;
}

const AutoReplyFormFixed = ({ model: { start, end, timezone }, updateModel }: Props) => {
    // Min date is used to calculate options.
    // In order to have rounded options such as 9:00AM or 9:30AM, we need to round the min date we give to the TimeInput
    const getMinTimeField = (date: Date) => {
        const dateMin = new Date(date);
        const minutes = dateMin.getMinutes();

        if (minutes < 30) {
            dateMin.setMinutes(30);
        } else {
            dateMin.setMinutes(0);
            dateMin.setHours(dateMin.getHours() + 1);
        }
        return dateMin;
    };

    return (
        <>
            <SettingsParagraph>
                {c('Info').t`Auto-reply is active from the start time to the end time.`}
            </SettingsParagraph>
            <DateField
                id="startDate"
                label={c('Label').t`Start date`}
                value={start.date}
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
                min={
                    start.time && start.date?.getTime() === end.date?.getTime()
                        ? getMinTimeField(start.time)
                        : undefined
                }
                preventNextDayOverflow
            />
            <TimeZoneField value={timezone} onChange={updateModel('timezone')} />
        </>
    );
};

export default AutoReplyFormFixed;
