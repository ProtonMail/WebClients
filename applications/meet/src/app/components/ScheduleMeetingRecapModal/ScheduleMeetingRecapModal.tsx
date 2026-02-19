import { useState } from 'react';

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
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { dateLocale } from '@proton/shared/lib/i18n';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { formatDate, formatTimeHHMM } from '../../utils/timeFormat';
import { ConditionalTooltip } from '../ConditionalTooltip/ConditionalTooltip';
import { DeleteMeetingModal } from '../DeleteMeetingModal/DeleteMeetingModal';
import { TranslucentModal } from '../TranslucentModal/TranslucentModal';
import { calendarDateFormats } from './utils';

import './ScheduleMeetingRecapModal.scss';

const SvgAddedIcon = ({ className }: { className?: string }) => (
    <svg
        width="64"
        height="57"
        viewBox="0 0 64 57"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('mb-5', className)}
    >
        <rect y="4.84375" width="57.6363" height="37.4764" rx="9.68644" fill="#B9ABFF" />
        <path
            d="M53.874 16.9434C55.9518 16.9435 57.6365 18.6283 57.6367 20.7061V46.7881C57.6367 52.1377 53.2997 56.4744 47.9502 56.4746H9.68652C4.33685 56.4746 0 52.1378 0 46.7881V20.7061C0.000178701 18.6282 1.68478 16.9434 3.7627 16.9434H53.874Z"
            fill="#413969"
        />
        <rect
            x="13.2139"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 13.2139 0)"
            fill="#9581FF"
        />
        <rect
            x="25.0527"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 25.0527 0)"
            fill="#9581FF"
        />
        <rect
            x="36.8918"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 36.8918 0)"
            fill="#9581FF"
        />
        <rect
            x="48.7307"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 48.7307 0)"
            fill="#9581FF"
        />
        <rect x="7.76367" y="23.2539" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="7.76367" y="23.2539" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="18.9885" y="23.2539" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="30.2131" y="23.2539" width="6.91969" height="5.38136" rx="2.69068" fill="#9581FF" />
        <rect x="41.438" y="23.2539" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="7.76367" y="31.8633" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="18.9885" y="31.8633" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="30.2131" y="31.8633" width="6.91969" height="5.38136" rx="2.69068" fill="#413969" />
        <rect x="41.438" y="31.8633" width="6.91969" height="5.38136" rx="2.69068" fill="#413969" />
        <rect x="7.76367" y="40.4746" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="18.9885" y="40.4746" width="6.91969" height="5.38136" rx="2.69068" fill="#B9ABFF" />
        <rect x="30.2131" y="40.4746" width="6.91969" height="5.38136" rx="2.69068" fill="#413969" />
        <rect x="41.438" y="40.4746" width="6.91969" height="5.38136" rx="2.69068" fill="#413969" />
        <path
            d="M64 25.6547L42.6874 51.2686L28.26 39.2455L32.1251 34.6063L41.9098 42.761L59.3582 21.793L64 25.6547Z"
            fill="#9581FF"
            className="meeting-icon-check"
        />
    </svg>
);

interface ScheduleMeetingModalProps {
    open: boolean;
    onClose: () => void;
    meetingLink: string;
    meetingName: string;
    meetingId: string;
    startTime: Date;
    endTime: Date;
    timeZone: string;
    rrule: string | null;
    isEdit: boolean;
    backToEditMeeting: () => void;
    meetingIsDecrypting: boolean;
}

export const ScheduleMeetingRecapModal = ({
    open,
    onClose,
    meetingLink,
    meetingName,
    meetingId,
    startTime,
    endTime,
    timeZone,
    rrule,
    isEdit = false,
    backToEditMeeting,
    meetingIsDecrypting,
}: ScheduleMeetingModalProps) => {
    const isProtonCalendarDeepLinkEnabled = useFlag('MeetProtonCalendarDeepLink');
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const timeFormat = userSettings.TimeFormat;
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const goToApp = useAppLink();
    const notifications = useNotifications();
    const [isDeleteMeetingModalOpen, setIsDeleteMeetingModalOpen] = useState(false);

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
        <TranslucentModal
            open={open}
            onClose={onClose}
            headerButtons={
                <>
                    <ConditionalTooltip title={meetingIsDecrypting ? c('Info').t`Meeting is decrypting...` : undefined}>
                        <Button
                            color="weak"
                            shape="outline"
                            pill
                            className="header-button h-custom flex items-center gap-2 px-3 md:px-5"
                            style={{ '--h-custom': '2.5rem' }}
                            onClick={backToEditMeeting}
                            disabled={meetingIsDecrypting}
                            icon
                        >
                            <IcPenSquare size={4} className="shrink-0" />
                            <span className="hidden md:flex">{c('Action').t`Edit`}</span>
                        </Button>
                    </ConditionalTooltip>

                    <Button
                        color="danger"
                        shape="outline"
                        pill
                        className="header-button h-custom flex items-center gap-2 px-3 md:px-5"
                        style={{ '--h-custom': '2.5rem' }}
                        onClick={() => setIsDeleteMeetingModalOpen(true)}
                    >
                        <IcTrash size={4} className="shrink-0" />
                        <span className="hidden md:flex">{c('Action').t`Delete`}</span>
                    </Button>
                </>
            }
        >
            <div style={{ '--max-w-custom': '35rem' }} className="max-w-custom">
                <div className="flex md:items-center justify-center">
                    <h1 className="create-container  flex flex-column gap-2 text-rg">
                        <div className="text-center">
                            <SvgAddedIcon className={!isEdit ? 'meeting-icon--added' : undefined} />
                            <span className="sr-only">
                                {isEdit ? c('Title').t`Meeting edited` : c('Title').t`Meeting created`}
                            </span>
                        </div>
                        <div className="create-container-title mb-3 w-full text-center text-wrap-balance text-break">
                            {meetingName}
                        </div>
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
                                {formatDate(endTime, timeZone)} {formatTimeHHMM(endTime, timeFormat, timeZone)} (
                                {timeZone})
                            </span>
                        </span>
                    )}
                </p>
                <div className="flex flex-column items-center align-center mt-10 gap-10">
                    <div className="w-full md:w-4/5">
                        <Card
                            className="flex flex-column meeting-details-card p-6"
                            bordered={false}
                            background={false}
                            rounded={false}
                        >
                            <p className="flex flex-nowrap flex-row items-center gap-2 max-w-full m-0">
                                <a
                                    className="meeting-link flex-1 text-break text-no-decoration"
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
                                        className="button-copy-meeting-link shrink-0 rounded-full"
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
                    <div className="flex flex-nowrap flex-column *:min-size-auto gap-2 w-full md:w-4/5">
                        <div className="w-full">
                            <DropdownButton
                                ref={anchorRef}
                                isOpen={isOpen}
                                onClick={toggle}
                                hasCaret={false}
                                shape="ghost"
                                className="text-semibold w-full calendar-dropdown-button rounded-full border-none flex items-center justify-center"
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
                            className="done-button text-semibold rounded-full w-full"
                            onClick={() => {
                                onClose();
                            }}
                            size="large"
                        >{c('Action').t`Done`}</Button>
                    </div>
                </div>
            </div>
            {isDeleteMeetingModalOpen && (
                <DeleteMeetingModal
                    meetingId={meetingId}
                    onClose={() => {
                        setIsDeleteMeetingModalOpen(false);
                    }}
                    onDelete={() => {
                        onClose();
                    }}
                    isRoom={false}
                />
            )}
        </TranslucentModal>
    );
};
