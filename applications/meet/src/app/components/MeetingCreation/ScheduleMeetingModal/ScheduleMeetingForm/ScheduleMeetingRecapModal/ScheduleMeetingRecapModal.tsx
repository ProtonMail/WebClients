import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import useAppLink from '@proton/components/components/link/useAppLink';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { TelemetryMeetDashboardEvents, sendMeetDashboardEvent } from '@proton/meet/telemetry/meetTelemetry';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { ConditionalTooltip } from '../../../../../atoms/ConditionalTooltip/ConditionalTooltip';
import type { MeetingVariant } from '../../../../../types';
import { DeleteMeetingModal } from '../../../../DashboardMeetingList/DeleteMeetingModal';
import { TranslucentModal } from '../../../../TranslucentModal/TranslucentModal';
import { ScheduleMeetingRecapAnimatedIcon } from './ScheduleMeetingRecapAnimatedIcon';
import { formatMeetingSchedule } from './formatMeetingSchedule';
import { calendarDateFormats } from './utils';

import './ScheduleMeetingRecapModal.scss';

interface CalendarOption {
    key: string;
    label: string;
    icon: ReactNode;
    onClick: () => void;
    opensInNewTab: boolean;
}

interface ScheduleMeetingModalProps {
    open: boolean;
    onClose: () => void;
    meetingLink: string;
    meetingName: string;
    meetingId: string;
    variant: MeetingVariant;
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
    variant,
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

    const { dateTime, recurrence } = formatMeetingSchedule({
        startTime,
        endTime,
        timeZone,
        rrule,
        timeFormat,
        now: new Date(),
        deviceTimeZone: getTimezone(),
    });

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

    const calendarOptions: CalendarOption[] = [
        {
            key: 'outlook-calendar',
            label: c('Label').t`Outlook Calendar`,
            icon: <IcArrowOutSquare className="shrink-0 color-weak" />,
            onClick: handleOutlookDeepLink,
            opensInNewTab: true,
        },
        {
            key: 'google-calendar',
            label: c('Label').t`Google Calendar`,
            icon: <IcArrowOutSquare className="shrink-0 color-weak" />,
            onClick: handleGoogleDeepLink,
            opensInNewTab: true,
        },
        {
            key: 'ics',
            label: c('Label').t`Download .ics`,
            icon: <IcArrowDownLine className="shrink-0 color-weak" />,
            onClick: handleIcs,
            opensInNewTab: false,
        },
        ...(isProtonCalendarDeepLinkEnabled
            ? [
                  {
                      key: 'proton-calendar',
                      label: CALENDAR_APP_NAME,
                      icon: <IcArrowOutSquare className="shrink-0 color-weak" />,
                      onClick: handleProtonCalendarDeepLink,
                      opensInNewTab: true,
                  },
              ]
            : []),
    ];

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
            <div
                style={{ '--max-w-custom': '33.5rem' }}
                className={`max-w-custom schedule-meeting-recap-modal variant-${variant}`}
            >
                <div className="flex md:items-center justify-center">
                    <h1 className="create-container flex flex-column gap-2 text-rg">
                        <div className="text-center">
                            <ScheduleMeetingRecapAnimatedIcon
                                variant={variant}
                                className={!isEdit ? 'meeting-icon--added' : undefined}
                            />
                            <span className="sr-only">
                                {isEdit ? c('Title').t`Meeting edited` : c('Title').t`Meeting created`}
                            </span>
                        </div>
                        <div className="create-container-title mb-4 w-full text-center text-wrap-balance text-break">
                            {meetingName}
                        </div>
                    </h1>
                </div>

                <div
                    style={{ fontWeight: 'var(--font-weight-medium)', lineHeight: 1.5 }}
                    className="color-weak text-rg text-center text-break text-wrap-balance flex flex-column gap-1 m-0 w-full"
                >
                    <p className="m-0">{dateTime}</p>
                    {recurrence && <p className="m-0">{recurrence}</p>}
                </div>
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
                                    className="meeting-link flex-1 text-break text-no-decoration"
                                    href={meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={meetingLink}
                                >
                                    {meetingLink}
                                    <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
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
                                            sendMeetDashboardEvent(TelemetryMeetDashboardEvents.meeting_link_copied, {
                                                source: 'schedule_recap',
                                            });
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
                    <div className="flex flex-nowrap flex-column md:flex-row *:min-size-auto gap-2 w-full">
                        <div className="flex-1">
                            <DropdownButton
                                ref={anchorRef}
                                isOpen={isOpen}
                                onClick={toggle}
                                hasCaret={false}
                                shape="ghost"
                                className="text-semibold w-full calendar-dropdown-button secondary rounded-full flex items-center justify-center"
                                size="large"
                            >
                                <span className="inline-flex items-center flex-nowrap gap-4">
                                    <IcPlus size={4} className="shrink-0" />
                                    {c('Label').t`Add to calendar`}
                                </span>
                            </DropdownButton>
                            <Dropdown
                                isOpen={isOpen}
                                anchorRef={anchorRef}
                                onClose={close}
                                originalPlacement="bottom-start"
                                size={{ width: DropdownSizeUnit.Anchor, maxWidth: DropdownSizeUnit.Viewport }}
                                adaptiveForTouchScreens={false}
                                className="calendar-dropdown"
                            >
                                <DropdownMenu>
                                    {calendarOptions.map(({ key, label, icon, onClick, opensInNewTab }) => (
                                        <DropdownMenuButton
                                            key={key}
                                            className="calendar-dropdown-menu text-left flex flex-nowrap items-center gap-3 border-none shrink-0"
                                            liClassName="w-full"
                                            onClick={onClick}
                                        >
                                            <span className="flex-1 text-left text-nowrap">
                                                {label}
                                                {opensInNewTab && (
                                                    <span className="sr-only">
                                                        {c('Accessibility').t`(opens in new tab)`}
                                                    </span>
                                                )}
                                            </span>
                                            {icon}
                                        </DropdownMenuButton>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                        <div className="flex-1">
                            <Button
                                className="done-button primary text-semibold rounded-full w-full"
                                onClick={() => {
                                    onClose();
                                }}
                                size="large"
                            >{c('Action').t`Done`}</Button>
                        </div>
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
