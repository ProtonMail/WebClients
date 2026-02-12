import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useAppLink from '@proton/components/components/link/useAppLink';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import useNotifications from '@proton/components/hooks/useNotifications';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton } from '@proton/components/index';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { dateLocale } from '@proton/shared/lib/i18n';
import scheduleIcon from '@proton/styles/assets/img/meet/schedule-icon.png';
import { useFlag } from '@proton/unleash';

import { formatDate, formatTimeHHMM } from '../../utils/timeFormat';
import { TranslucentModal } from '../TranslucentModal/TranslucentModal';
import { calendarDateFormats } from './utils';

import './ScheduleMeetingRecapModal.scss';

interface ScheduleMeetingModalProps {
    open: boolean;
    onClose: () => void;
    meetingLink: string;
    meetingName: string;
    startTime: Date;
    endTime: Date;
    timeZone: string;
    rrule: string | null;
    isEdit: boolean;
}

export const ScheduleMeetingRecapModal = ({
    open,
    onClose,
    meetingLink,
    meetingName,
    startTime,
    endTime,
    timeZone,
    rrule,
    isEdit = false,
}: ScheduleMeetingModalProps) => {
    const isProtonCalendarDeepLinkEnabled = useFlag('MeetProtonCalendarDeepLink');
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const timeFormat = userSettings.TimeFormat;
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const goToApp = useAppLink();
    const notifications = useNotifications();

    const endsOnSameDay = (() => {
        const formatter = new Intl.DateTimeFormat(dateLocale.code, {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        const startDateStr = formatter.format(startTime);
        const endDateStr = formatter.format(endTime);

        return startDateStr === endDateStr;
    })();

    const uriMeetingLink = encodeURIComponent(meetingLink);
    const uriTitle = encodeURIComponent(meetingName);
    const {
        localCompactWithTimezone: localCompactWithTimezoneStarTime,
        utcCompact: utcCompactStarTime,
        utcISO: utcISOStartTime,
    } = calendarDateFormats(startTime, timeZone);
    const {
        localCompactWithTimezone: localCompactWithTimezoneEndTime,
        utcCompact: utcCompactEndTime,
        utcISO: utcISOEndTime,
    } = calendarDateFormats(endTime, timeZone);

    const handleOutlookDeepLink = () => {
        openNewTab(
            `https://outlook.live.com/calendar/0/deeplink/compose?subject=${uriTitle}&startdt=${utcISOStartTime}&enddt=${utcISOEndTime}&body=${uriMeetingLink}&location=${uriMeetingLink}`
        );
    };

    const handleGoogleDeepLink = () => {
        openNewTab(
            `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${meetingName}&dates=${utcCompactStarTime}/${utcCompactEndTime}&ctz=${timeZone}&details=${uriMeetingLink}&location=${uriMeetingLink}`
        );
    };

    const handleProtonCalendarDeepLink = () => {
        goToApp(
            `/?action=create&videoConferenceProvider=2&conferenceUrl=${uriMeetingLink}&title=${meetingName}&email=${encodeURIComponent(user.Email)}`,
            APPS.PROTONCALENDAR,
            true
        );
    };

    const handleIcs = () => {
        const { utcCompact: dtstamp } = calendarDateFormats(new Date());

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Proton Meet//EN',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@${user.Email}`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART;TZID=${timeZone}:${localCompactWithTimezoneStarTime}`,
            `DTEND;TZID=${timeZone}:${localCompactWithTimezoneEndTime}`,
            ...(rrule ? [`RRULE:${rrule}`] : []),
            `SUMMARY:${meetingName}`,
            `DESCRIPTION:${meetingLink}`,
            `LOCATION:${meetingLink}`,
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'event.ics';
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <TranslucentModal open={open} onClose={onClose}>
            <div className="flex md:items-center justify-center">
                <h1
                    className="create-container max-w-custom flex flex-column gap-2 text-rg"
                    style={{ '--max-w-custom': '35rem' }}
                >
                    <div className="text-center">
                        <img
                            className="w-custom h-custom mb-5"
                            src={scheduleIcon}
                            alt={isEdit ? c('Title').t`Meeting edited` : c('Title').t`Meeting created`}
                            style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
                        />
                    </div>
                    <div className="text-4xl mb-5 w-full text-center text-wrap-balance text-break">{meetingName}</div>
                </h1>
            </div>

            <p className="color-weak mt-0 text-center w-full">
                {endsOnSameDay ? (
                    <span className="inline-flex justify-center flex-row items-center color-weak gap-1">
                        <span>{formatDate(startTime, timeZone)}</span>
                        <span>
                            {formatTimeHHMM(startTime, timeFormat, timeZone)} -{' '}
                            {formatTimeHHMM(endTime, timeFormat, timeZone)} ({timeZone})
                        </span>
                    </span>
                ) : (
                    <span className="inline-flex justify-center flex-row items-center color-weak gap-1">
                        <span>
                            {formatDate(startTime, timeZone)} {formatTimeHHMM(startTime, timeFormat, timeZone)} (
                            {timeZone})
                        </span>
                        <span>
                            {formatDate(endTime, timeZone)} {formatTimeHHMM(endTime, timeFormat, timeZone)} ({timeZone})
                        </span>
                    </span>
                )}
            </p>
            <div className="flex flex-column items-center align-center mt-10 gap-10">
                <div className="w-full">
                    <Card
                        className="flex flex-column meeting-details-card p-6"
                        bordered={false}
                        background={false}
                        rounded={false}
                    >
                        <p className="flex flex-nowrap flex-row items-center gap-2 max-w-full m-0">
                            <a
                                className="meeting-link flex-1"
                                href={meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={meetingLink}
                            >
                                {meetingLink}
                            </a>
                            <Tooltip title={c('Action').t`Copy meeting link`}>
                                <Button
                                    shape="ghost"
                                    color="norm"
                                    type="button"
                                    icon
                                    className="shrink-0"
                                    onClick={() => {
                                        void navigator.clipboard.writeText(meetingLink);
                                        notifications.createNotification({
                                            key: 'link-copied',
                                            text: c('Notification').t`Link copied to clipboard`,
                                        });
                                    }}
                                >
                                    <IcSquares alt={c('Action').t`Copy meeting link`} />
                                </Button>
                            </Tooltip>
                        </p>
                    </Card>
                </div>
                <div className="flex flex-nowrap flex-column *:min-size-auto md:flex-row gap-4 w-full">
                    <div className="w-full">
                        <DropdownButton
                            ref={anchorRef}
                            isOpen={isOpen}
                            onClick={toggle}
                            hasCaret={false}
                            shape="ghost"
                            className="w-full calendar-dropdown-button rounded-full border-none flex items-center justify-center"
                            size="large"
                        >
                            <span className="inline-flex items-center flex-nowrap gap-2">
                                <IcPlus size={4} className="shrink-0" />
                                {c('Label').t`Add to calendar`}
                            </span>
                        </DropdownButton>
                        <Dropdown
                            isOpen={isOpen}
                            anchorRef={anchorRef}
                            onClose={close}
                            className="calendar-dropdown meet-radius"
                        >
                            <DropdownMenu>
                                <DropdownMenuButton
                                    className="calendar-dropdown-menu text-left large-meet-radius flex flex-nowrap items-center gap-2 border-none shrink-0"
                                    key="outlook-calendar"
                                    onClick={handleOutlookDeepLink}
                                >
                                    {c('Label').t`Outlook calendar`}
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="calendar-dropdown-menu text-left large-meet-radius flex flex-nowrap items-center gap-2 border-none shrink-0"
                                    key="google-calendar"
                                    onClick={handleGoogleDeepLink}
                                >
                                    {c('Label').t`Google calendar`}
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="calendar-dropdown-menu text-left large-meet-radius flex flex-nowrap items-center gap-2 border-none shrink-0"
                                    key="ics"
                                    onClick={handleIcs}
                                >
                                    {c('Label').t`Download .ics`}
                                </DropdownMenuButton>
                                {isProtonCalendarDeepLinkEnabled && (
                                    <DropdownMenuButton
                                        className="calendar-dropdown-menu text-left large-meet-radius flex flex-nowrap items-center gap-2 border-none shrink-0"
                                        key="proton-calendar"
                                        onClick={handleProtonCalendarDeepLink}
                                    >
                                        {CALENDAR_APP_NAME}
                                    </DropdownMenuButton>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                    <Button
                        className="done-button rounded-full w-full"
                        onClick={() => {
                            onClose();
                        }}
                        size="large"
                    >{c('Action').t`Done`}</Button>
                </div>
            </div>
        </TranslucentModal>
    );
};
