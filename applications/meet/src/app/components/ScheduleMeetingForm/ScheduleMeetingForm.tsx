import { useEffect, useMemo, useState } from 'react';

import { utcToZonedTime } from 'date-fns-tz';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useAppLink from '@proton/components/components/link/useAppLink';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useNotifications } from '@proton/components/index';
import { useLoading } from '@proton/hooks/index';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { IcTextAlignLeft } from '@proton/icons/icons/IcTextAlignLeft';
import {
    generateMeetingLinkFromMeeting,
    useCreateMeeting,
    useDeleteMeeting,
    useGetMeetingDependencies,
} from '@proton/meet';
import { useMeetingUpdates } from '@proton/meet/hooks/useMeetingUpdates';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { addMeeting, removeMeeting, updateMeeting } from '@proton/meet/store/slices';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getTimeZoneOptions, getTimezone } from '@proton/shared/lib/date/timezone';
import { type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';
import scheduleIcon from '@proton/styles/assets/img/meet/schedule-icon.png';

import { formatTimeHHMM } from '../../utils/timeFormat';
import { ScheduleMeetingRecapModal } from '../ScheduleMeetingRecapModal/ScheduleMeetingRecapModal';
import { TimeInputBlock } from '../TimeInputBlock';
import { combineDateAndTime, getInitialValues, validate } from './utils';

import './ScheduleMeetingForm.scss';

const minutes = ['00', '15', '30', '45'];
const timeZoneSelectOptions = getTimeZoneOptions().map((option) => ({ label: option.text, value: option.value }));

interface ScheduleMeetingFormProps {
    open: boolean;
    onClose: () => void;
    meeting?: Meeting;
    isLoading?: boolean;
}

export const ScheduleMeetingForm = ({ open, onClose, meeting }: ScheduleMeetingFormProps) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const timeFormat = userSettings.TimeFormat;
    const { saveMeetingName, saveMeetingSchedule } = useMeetingUpdates();
    const { deleteMeeting } = useDeleteMeeting();
    const dispatch = useMeetDispatch();
    const getMeetingDependencies = useGetMeetingDependencies();

    const notifications = useNotifications();

    const [loading, withLoading] = useLoading();
    const [loadingDelete, withLoadingDelete] = useLoading();
    const [meetingLink, setMeetingLink] = useState<string | null>(null);

    const userTimeZone = getTimezone();

    const goToApp = useAppLink();

    const [showTimezones, setShowTimezones] = useState(false);

    const [result, setResult] = useState<{
        meetingLink: string;
        meetingName: string;
        rrule: string | null;
    } | null>(null);

    const userName = user.DisplayName !== '' ? user.DisplayName : user.Name;

    const [values, setValues] = useState({
        ...getInitialValues(),
        timeZone: userTimeZone,
        meetingName: userName !== '' ? c('Info').t`${userName}'s Meeting` : c('Info').t`My Meeting`,
    });

    const { createMeeting } = useCreateMeeting();

    const timeZoneAction = showTimezones ? c('Action').t`Hide timezones` : c('Action').t`Show timezones`;

    useEffect(() => {
        if (meeting) {
            const updates: Partial<typeof values> = {
                meetingName: meeting.MeetingName,
            };

            if (meeting.Timezone) {
                updates.timeZone = meeting.Timezone;
            }

            if (meeting.RRule) {
                updates.recurrence = meeting.RRule;
            } else {
                updates.recurrence = 'NO_REPEAT';
            }

            if (meeting.StartTime && meeting.Timezone) {
                const startDateTime = utcToZonedTime(new Date(Number(meeting.StartTime) * 1000), meeting.Timezone);
                updates.startDate = startDateTime;
                const startHours = String(startDateTime.getHours()).padStart(2, '0');
                const startMinutes = String(startDateTime.getMinutes()).padStart(2, '0');
                updates.startTime = `${startHours}:${startMinutes}`;
            }

            if (meeting.EndTime && meeting.Timezone) {
                const endDateTime = utcToZonedTime(new Date(Number(meeting.EndTime) * 1000), meeting.Timezone);
                updates.endDate = endDateTime;
                const endHours = String(endDateTime.getHours()).padStart(2, '0');
                const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0');
                updates.endTime = `${endHours}:${endMinutes}`;
            }

            setValues((prev) => ({
                ...prev,
                ...updates,
            }));
        }
    }, [meeting]);

    useEffect(() => {
        const generateLink = async () => {
            if (meeting) {
                try {
                    const { userKeys } = await getMeetingDependencies();
                    const link = await generateMeetingLinkFromMeeting(meeting, userKeys);
                    setMeetingLink(link);
                } catch (error) {
                    setMeetingLink(null);
                }
            } else {
                setMeetingLink(null);
            }
        };

        void generateLink();
    }, [meeting, getMeetingDependencies]);

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
            let meetingLink;

            if (!!meeting) {
                await saveMeetingName({
                    newTitle: meetingName,
                    id: meeting.ID,
                    meetingObject: meeting,
                });
                const response = await saveMeetingSchedule({
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    timezone: values.timeZone,
                    recurrence: rrule,
                    id: meeting.ID,
                    meetingObject: meeting,
                });
                dispatch(updateMeeting(response));
                const { userKeys } = await getMeetingDependencies();
                const meetingForLink = {
                    ...response,
                    Password: meeting.Password, // Use decrypted password
                };
                meetingLink = await generateMeetingLinkFromMeeting(meetingForLink, userKeys);
            } else {
                const { meetingLink: link, meeting: newMeeting } = await createMeeting({
                    ...restOfValues,
                    meetingName: meetingName,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    recurrence: rrule,
                    type,
                });
                dispatch(addMeeting(newMeeting));
                meetingLink = link;
            }

            setResult({
                meetingLink: meetingLink.startsWith('http') ? meetingLink : `${window.location.origin}${meetingLink}`,
                meetingName: meetingName,
                rrule: rrule,
            });
        } catch (error) {
            window.alert(error instanceof Error ? error.message : c('Error').t`Failed to create meeting`);
        }
    };

    const handleDeleteMeeting = async (meeting: Meeting) => {
        await deleteMeeting(meeting.ID)
            .then(() => {
                dispatch(removeMeeting(meeting.ID));
                notifications.createNotification({
                    text: c('Info').t`Successfully deleted meeting`,
                });
                onClose();
            })
            .catch((error) => {
                const { message } = getApiError(error);
                notifications.createNotification({
                    type: 'error',
                    text: message,
                });
            });
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
        { label: c('Label').t`Does not repeat`, value: 'NO_REPEAT' },
        { label: c('Label').t`Every day`, value: 'FREQ=DAILY' },
        {
            label: c('Label').t`Every weekday`,
            sublabel: c('Label').t`Monday to Friday`,
            value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        },
        { label: c('Label').t`Every week`, value: 'FREQ=WEEKLY' },
        { label: c('Label').t`Every month`, value: 'FREQ=MONTHLY' },
        { label: c('Label').t`Every year`, value: 'FREQ=YEARLY' },
    ];

    const handleCopyLink = () => {
        if (!meetingLink) {
            return;
        }
        void navigator.clipboard.writeText(meetingLink);
        notifications.createNotification({
            key: 'link-copied',
            text: c('Notification').t`Link copied to clipboard`,
        });
    };

    if (meeting?.CalendarID && meeting.CalendarEventID) {
        goToApp(
            `/?action=edit&eventId=${meeting.CalendarEventID}&calendarId=${meeting.CalendarID}&videoConferenceProvider=2`,
            APPS.PROTONCALENDAR,
            false
        );

        return <></>;
    }

    return (
        <>
            {result && (
                <ScheduleMeetingRecapModal
                    open={open}
                    onClose={onClose}
                    meetingName={result.meetingName}
                    meetingLink={result.meetingLink}
                    startTime={combineDateAndTime(values.startDate, values.startTime, values.timeZone)}
                    endTime={combineDateAndTime(values.endDate, values.endTime, values.timeZone)}
                    timeZone={values.timeZone}
                    rrule={result.rrule}
                    isEdit={!!meeting}
                />
            )}
            <div className="flex md:items-center justify-center">
                <div className="create-container w-custom flex flex-column gap-2" style={{ '--w-custom': '35rem' }}>
                    <div className="text-center">
                        <img
                            className="w-custom h-custom mb-2"
                            src={scheduleIcon}
                            alt=""
                            style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
                        />
                    </div>
                    <div className="text-4xl mb-6 w-full text-center">
                        {meeting ? values.meetingName : c('Title').t`Schedule a meeting`}
                    </div>
                    <div className="text-left mb-5">
                        <InlineLinkButton onClick={goToCalendar} className="text-no-decoration">
                            {c('Placeholder').t`Schedule in ${CALENDAR_APP_NAME}`}
                            <IcArrowWithinSquare size={4} className="ml-1" />
                        </InlineLinkButton>
                    </div>
                    <div className="w-full flex flex-nowrap items-center gap-4">
                        <IcTextAlignLeft
                            size={5}
                            className="shrink-0"
                            style={{ color: 'var(--interaction-weak-major-3)' }}
                        />
                        <InputFieldTwo
                            id="meetingName"
                            name="meetingName"
                            placeholder={c('Placeholder').t`Enter meeting title`}
                            onChange={(e) => setValues({ ...values, meetingName: e.target.value })}
                            autoComplete="off"
                            value={values.meetingName}
                            error={errors.meetingName}
                            autoFocus
                        />
                    </div>
                    {meetingLink && (
                        <div className="w-full flex flex-nowrap items-center gap-4">
                            <IcLink size={5} style={{ color: 'var(--interaction-weak-major-3)' }} />
                            <div className="flex flex-row input-link border border-norm p-5">
                                <div className="flex flex-column flex-1">
                                    <Href href={meetingLink} className="text-break text-no-decoration">
                                        {meetingLink}
                                    </Href>
                                </div>

                                <div className="flex flex-column justify-center pl-5">
                                    <Button
                                        shape="solid"
                                        color="norm"
                                        icon
                                        className="rounded-50 p-2 ml-2 flex justify-center items-center button-copy"
                                        title={c('Action').t`Copy link`}
                                        onClick={handleCopyLink}
                                    >
                                        <IcSquares size={4} alt={c('Alt').t`Copy link`} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="w-full flex flex-nowrap items-center justify-end gap-2">
                        <Button
                            className="color-primary ml-auto rounded-full timezone-button"
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
                        <IcArrowsRotate
                            size={5}
                            className="shrink-0"
                            style={{ color: 'var(--interaction-weak-major-3)' }}
                        />
                        <SelectTwo
                            className="select-two-repeat"
                            dropdownClassName="select-two-repeat-dropdown meet-radius"
                            onChange={(item: { value: string }) => {
                                setValues({ ...values, recurrence: item.value as string });
                            }}
                            value={values.recurrence}
                            dropdownHeading={
                                <div className="select-dropdown-heading-inner text-uppercase text-sm">{c('Label')
                                    .t`Repeat event`}</div>
                            }
                        >
                            {repeatOptions.map((option) => (
                                <Option
                                    key={option.value}
                                    value={option.value}
                                    title={option.label}
                                    className="flex flex-row items-center"
                                >
                                    <span className="flex-1">
                                        {option.label}{' '}
                                        {option.sublabel && (
                                            <span className="ml-1 text-sm color-hint">{option.sublabel}</span>
                                        )}
                                    </span>
                                    {values.recurrence === option.value && (
                                        <span className="text-sm shrink-0 select-two-repeat-check-container">
                                            <IcCheckmark size={4} />
                                        </span>
                                    )}
                                </Option>
                            ))}
                        </SelectTwo>
                    </div>
                    <div className="w-full flex flex-nowrap justify-center flex-row mt-5 gap-4">
                        <Button
                            className="delete-button rounded-full w-full"
                            onClick={() => (meeting ? withLoadingDelete(handleDeleteMeeting(meeting)) : onClose())}
                            size="large"
                            disabled={loading || loadingDelete}
                            loading={loadingDelete}
                        >
                            {meeting ? c('Action').t`Delete` : c('Action').t`Cancel`}
                        </Button>
                        <Button
                            className="save-button rounded-full w-full"
                            onClick={() => withLoading(handleSubmit)}
                            size="large"
                            disabled={isDisabled || loading || loadingDelete}
                            loading={loading}
                        >{c('Action').t`Save`}</Button>
                    </div>
                </div>
            </div>
        </>
    );
};
