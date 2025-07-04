import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DateInputTwo, InputFieldTwo, Label, Option, PasswordInputTwo, SelectTwo, Toggle } from '@proton/components';
import { IcCalendarDay, IcClock } from '@proton/icons';
import { format } from '@proton/shared/lib/date-fns-utc';
import { getTimeZoneOptions } from '@proton/shared/lib/date/timezone';

import { useCreateMeeting } from '../../hooks/admin/useCreateMeeting';
import { MeetingType } from '../../response-types';
import type { MeetingDetails } from '../../types';

import './CreateContainer.scss';

const durationOptions = [
    { label: '15 minutes', value: 15 * 60 * 1000 },
    { label: '30 minutes', value: 30 * 60 * 1000 },
    { label: '45 minutes', value: 45 * 60 * 1000 },
    { label: '1 hour', value: 60 * 60 * 1000 },
    { label: '2 hours', value: 2 * 60 * 60 * 1000 },
    { label: '3 hours', value: 3 * 60 * 60 * 1000 },
    { label: '4 hours', value: 4 * 60 * 60 * 1000 },
];

const initialValues = {
    meetingName: '',
    startDate: new Date(),
    time: format(new Date(), 'HH:mm'),
    duration: durationOptions[1].value,
    recurring: false,
    timeZone: '',
    customPassword: '',
};

interface CreateContainerProps {
    onMeetingCreated: (meetingDetails: MeetingDetails) => void;
}

export const CreateContainer = ({ onMeetingCreated }: CreateContainerProps) => {
    const history = useHistory();

    const [values, setValues] = useState(initialValues);

    const { createMeeting } = useCreateMeeting();

    const timeZoneOptions = useMemo(
        () => getTimeZoneOptions().map((option) => ({ label: option.text, value: option.value })),
        []
    );

    const handleSubmit = async () => {
        const { startDate, time, duration, recurring, ...restOfValues } = values;

        const [hours, minutes] = time.split(':').map(Number);

        const startTime = new Date(startDate);

        startTime.setHours(hours, minutes, 0, 0);

        const endTime = new Date(startTime.getTime() + duration);

        const type = recurring ? MeetingType.RECURRING : MeetingType.SCHEDULED;

        const rrule = recurring ? recurring : null;

        try {
            const { meetingLink, id } = await createMeeting({
                ...restOfValues,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                recurring: rrule,
                type,
            });

            onMeetingCreated({
                meetingId: id,
                meetingName: values.meetingName,
                date: startTime.toISOString(),
                time: time,
                meetingLink,
                duration: durationOptions.find((option) => option.value === duration)?.label as string,
            });

            history.push(`/admin/details/${id}`);
        } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Failed to create meeting');
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div
                className="w-custom h-custom border border-strong rounded-xl p-4 flex flex-column bg-norm"
                style={{ '--w-custom': '40rem', '--h-custom': '40rem' }}
            >
                <h2 className="h2 mb-6">Schedule a Meeting</h2>
                <div id="create_meeting_form" className="flex flex-column flex-1 gap-2">
                    <InputFieldTwo
                        id="meetingName"
                        name="meetingName"
                        label={c('l10n_nightly Label').t`Meeting Title`}
                        placeholder={c('l10n_nightly Placeholder').t`Enter meeting title`}
                        onChange={(e) => setValues({ ...values, meetingName: e.target.value })}
                        autoComplete="off"
                        value={values.meetingName}
                    />
                    <div className="flex flex-nowrap gap-2">
                        <div className="flex flex-column w-1/2">
                            <Label className="pt-0 mb-1" htmlFor="startDate">
                                {c('l10n_nightly Label').t`Date`}
                            </Label>
                            <DateInputTwo
                                min={new Date()}
                                preventValueReset
                                onChange={(date) => setValues({ ...values, startDate: date as Date })}
                                className="date-input"
                                inputClassName="date-input"
                                suffix={<IcCalendarDay size={4} />}
                                value={values.startDate}
                            />
                        </div>

                        <InputFieldTwo
                            rootClassName="w-1/2"
                            name="time"
                            label={c('l10n_nightly Label').t`Time`}
                            suffix={<IcClock size={4} />}
                            value={values.time}
                            onChange={(e) => setValues({ ...values, time: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-nowrap gap-2">
                        <div className="flex flex-column w-1/2">
                            <Label className="pt-0 mb-1" htmlFor="duration">
                                {c('l10n_nightly Label').t`Duration`}
                            </Label>
                            <SelectTwo
                                name="duration"
                                className="w-1/2"
                                onValue={(value: number) => setValues({ ...values, duration: value as number })}
                                value={values.duration}
                            >
                                {durationOptions.map((option) => (
                                    <Option key={option.value} value={option.value} title={option.label}>
                                        {option.label}
                                    </Option>
                                ))}
                            </SelectTwo>
                        </div>
                        <div className="flex flex-column w-1/2">
                            <Label className="pt-0 mb-1" htmlFor="timeZone">
                                {c('l10n_nightly Label').t`Time zone`}
                            </Label>
                            <SelectTwo
                                name="timeZone"
                                className="w-1/2"
                                onValue={(value: string) => setValues({ ...values, timeZone: value as string })}
                                value={values.timeZone}
                                dropdownClassName="time-zone-dropdown"
                            >
                                {timeZoneOptions.map((option) => (
                                    <Option key={option.value} value={option.value} title={option.label}>
                                        {option.label}
                                    </Option>
                                ))}
                            </SelectTwo>
                        </div>
                    </div>
                    <InputFieldTwo
                        id="customPassword"
                        name="customPassword"
                        label={c('l10n_nightly Label').t`Meeting password`}
                        placeholder={c('l10n_nightly Placeholder')
                            .t`Enter meeting password, leave empty for no password`}
                        as={PasswordInputTwo}
                        autoComplete="off"
                        value={values.customPassword}
                        onChange={(e) => setValues({ ...values, customPassword: e.target.value })}
                    />

                    <div className="flex items-center justify-space-between w-full">
                        <Label className="mb-1" htmlFor="recurring">
                            {c('l10n_nightly Label').t`Recurring Meeting`}
                        </Label>
                        <Toggle
                            id="recurring"
                            checked={values.recurring}
                            onChange={() => setValues({ ...values, recurring: !values.recurring })}
                        />
                    </div>

                    <div className="flex justify-end w-full mt-auto">
                        <Button className="rounded-full" color="norm" type="submit" onClick={handleSubmit}>{c(
                            'l10n_nightly Action'
                        ).t`Schedule Meeting`}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
