import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useAppLink from '@proton/components/components/link/useAppLink';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useLoading } from '@proton/hooks/index';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcTextAlignLeft } from '@proton/icons/icons/IcTextAlignLeft';
import { useCreateMeeting } from '@proton/meet/hooks/useCreateMeeting';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getTimeZoneOptions, getTimezone } from '@proton/shared/lib/date/timezone';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { MeetingCreatedModal } from '../../components/MeetingCreatedModal/MeetingCreatedModal';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TimeInputBlock } from '../../components/TimeInputBlock';
import { formatTimeHHMM } from '../../utils/timeFormat';
import { combineDateAndTime, getInitialValues, validate } from './utils';

import './CreateContainer.scss';

const minutes = ['00', '15', '30', '45'];

const timeZoneSelectOptions = getTimeZoneOptions().map((option) => ({ label: option.text, value: option.value }));
interface CreateContainerProps {
    isEdit?: boolean;
}

export const CreateContainer = ({}: CreateContainerProps) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const timeFormat = userSettings.TimeFormat;

    const [loading, withLoading] = useLoading();

    const userTimeZone = getTimezone();

    const history = useHistory();

    const goToApp = useAppLink();

    const [showTimezones, setShowTimezones] = useState(false);

    const [result, setResult] = useState<{
        meetingLink: string;
        meetingName: string;
        rrule: string | null;
    } | null>(null);

    const [values, setValues] = useState({
        ...getInitialValues(),
        timeZone: userTimeZone,
        meetingName: c('Info').t`${user.DisplayName}'s Meeting`,
    });

    const { createMeeting } = useCreateMeeting();

    const timeZoneAction = showTimezones ? c('Action').t`Hide timezones` : c('Action').t`Show timezones`;

    const errors = useMemo(() => validate(values), [values]);

    const isDisabled = useMemo(() => {
        return Object.values(errors).some((error) => error);
    }, [errors]);

    const timeOptions = useMemo(() => {
        return [...Array(24).keys()]
            .map((item) => {
                const hourString = item > 9 ? item : `${0}${item}`;

                return minutes.map((minute) => {
                    const value = `${hourString}:${minute}`;
                    // Create a date object with a random date, only time matters
                    const date = new Date(1900, 0, 1, item, parseInt(minute), 0, 0);

                    return {
                        value: value,
                        label: formatTimeHHMM(date, timeFormat),
                    };
                });
            })
            .flat();
    }, [timeFormat]);

    const handleSubmit = async () => {
        const { startDate, recurrence, meetingName, ...restOfValues } = values;

        const startTime = combineDateAndTime(startDate, values.startTime, values.timeZone);

        const endTime = combineDateAndTime(values.endDate, values.endTime, values.timeZone);

        const type = recurrence && recurrence !== 'NO_REPEAT' ? MeetingType.RECURRING : MeetingType.SCHEDULED;

        const rrule = recurrence === 'NO_REPEAT' ? null : recurrence;

        try {
            const { meetingLink } = await createMeeting({
                ...restOfValues,
                meetingName: meetingName,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                recurrence: rrule,
                type,
            });

            setResult({
                meetingLink: `${window.location.origin}${meetingLink}`,
                meetingName: meetingName,
                rrule: rrule,
            });
        } catch (error) {
            window.alert(error instanceof Error ? error.message : c('Error').t`Failed to create meeting`);
        }
    };

    useEffect(() => {
        if (values.startTime >= values.endTime) {
            setValues((prev) => ({
                ...prev,
                endTime: timeOptions.find((option) => option.value > values.startTime)?.value ?? values.startTime,
            }));
        }
    }, [values.startTime, values.endTime]);

    const startTimeOptions = useMemo(() => {
        const now = new Date();
        return timeOptions.filter(
            (option) => combineDateAndTime(values.startDate, option.value, values.timeZone) > now
        );
    }, [values.startDate]);

    const endTimeOptions = useMemo(() => {
        const now = new Date();
        return timeOptions.filter((option) => combineDateAndTime(values.endDate, option.value, values.timeZone) > now);
    }, [values.endDate]);

    const goToCalendar = () => {
        goToApp(
            `/?action=create&videoConferenceProvider=2&email=${encodeURIComponent(user.Email)}`,
            APPS.PROTONCALENDAR,
            true
        );
    };

    const repeatOptions = [
        { label: c('Label').t`No repeat`, value: 'NO_REPEAT' },
        { label: c('Label').t`Every day`, value: 'FREQ=DAILY' },
        {
            label: c('Label').t`Every weekday`,
            sublabel: c('Label').t`Monday to Friday`,
            value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        },
        { label: c('Label').t`Every month`, value: 'FREQ=MONTHLY' },
        { label: c('Label').t`Every year`, value: 'FREQ=YEARLY' },
    ];

    return (
        <>
            {result && (
                <MeetingCreatedModal
                    meetingName={result.meetingName}
                    meetingLink={result.meetingLink}
                    startTime={combineDateAndTime(values.startDate, values.startTime, values.timeZone)}
                    endTime={combineDateAndTime(values.endDate, values.endTime, values.timeZone)}
                    timeZone={values.timeZone}
                    rrule={result.rrule}
                    onClose={() => history.goBack()}
                />
            )}
            <div className="w-full h-full meet-container-padding-x overflow-y-auto lg:overflow-y-hidden flex flex-column flex-nowrap bg-weak">
                <PageHeader guestMode={false} showAppSwitcher={false} isInstantJoin={false} />
                <div className="flex md:items-center md:justify-center">
                    <div
                        className="create-container max-w-custom flex flex-column gap-2 md:mt-5"
                        style={{ '--max-w-custom': '35rem' }}
                    >
                        <div className="text-4xl mb-6 w-full text-center">{c('Title').t`Schedule a meeting`}</div>
                        <InlineLinkButton onClick={goToCalendar} className="mb-5 text-no-decoration">
                            {c('Placeholder').t`Schedule in ${CALENDAR_APP_NAME}`}
                            <IcArrowWithinSquare size={4} className="ml-1" />
                        </InlineLinkButton>
                        <div className="w-full flex flex-nowrap items-center gap-4">
                            <IcTextAlignLeft size={5} />
                            <InputFieldTwo
                                id="meetingName"
                                name="meetingName"
                                placeholder={c('Placeholder').t`Enter meeting title`}
                                onChange={(e) => setValues({ ...values, meetingName: e.target.value })}
                                autoComplete="off"
                                value={values.meetingName}
                                error={errors.meetingName}
                            />
                        </div>
                        <div className="w-full flex flex-nowrap items-center justify-end gap-2">
                            <Button
                                className="color-primary ml-auto rounded-full"
                                shape="ghost"
                                onClick={() => setShowTimezones(!showTimezones)}
                            >
                                {timeZoneAction}
                            </Button>
                        </div>

                        <TimeInputBlock
                            name="start"
                            values={values}
                            setValues={setValues}
                            showTimezones={showTimezones}
                            timeOptions={startTimeOptions}
                            timeZoneOptions={timeZoneSelectOptions}
                            timeFormat={timeFormat}
                            timeError={errors.startTime}
                        />

                        <TimeInputBlock
                            name="end"
                            values={values}
                            setValues={setValues}
                            showTimezones={showTimezones}
                            timeOptions={endTimeOptions}
                            timeZoneOptions={timeZoneSelectOptions}
                            timeFormat={timeFormat}
                            showIcon={false}
                            editableTimeZone={false}
                            timeError={errors.endTime}
                        />
                        <div className="w-full flex flex-nowrap items-center gap-4">
                            <IcArrowsRotate size={5} />
                            <SelectTwo
                                onChange={(item: { value: string }) => {
                                    setValues({ ...values, recurrence: item.value as string });
                                }}
                                value={values.recurrence}
                            >
                                {repeatOptions.map((option) => (
                                    <Option key={option.value} value={option.value} title={option.label}>
                                        {option.label}
                                    </Option>
                                ))}
                            </SelectTwo>
                        </div>
                        <div className="w-full flex flex-nowrap justify-center flex-row mt-5 gap-4">
                            <Button
                                className="secondary-action-button rounded-full w-full"
                                onClick={() => history.goBack()}
                                size="large"
                            >
                                {c('Action').t`Cancel`}
                            </Button>
                            <Button
                                className="bg-primary rounded-full w-full"
                                onClick={() => withLoading(handleSubmit)}
                                size="large"
                                disabled={isDisabled}
                                loading={loading}
                            >{c('Action').t`Save meeting`}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
