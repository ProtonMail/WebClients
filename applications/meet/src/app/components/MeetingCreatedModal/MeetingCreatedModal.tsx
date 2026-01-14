import React from 'react';
import { useHistory } from 'react-router';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import useAppLink from '@proton/components/components/link/useAppLink';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton } from '@proton/components/index';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { dateLocale } from '@proton/shared/lib/i18n';
import { useFlag } from '@proton/unleash';

import { formatDate, formatTimeHHMM } from '../../utils/timeFormat';
import { calendarDateFormats } from './utils';

import './MeetingCreatedModal.scss';

interface MeetingCreatedModalProps {
    meetingLink: string;
    meetingName: string;
    startTime: Date;
    endTime: Date;
    timeZone: string;
    rrule: string | null;
    onClose: () => void;
}

export const MeetingCreatedModal = ({
    meetingLink,
    meetingName,
    startTime,
    endTime,
    timeZone,
    rrule,
    onClose,
}: MeetingCreatedModalProps) => {
    const isProtonCalendarDeepLinkEnabled = useFlag('MeetProtonCalendarDeepLink');
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const timeFormat = userSettings.TimeFormat;
    const history = useHistory();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const goToApp = useAppLink();

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
        <ModalTwo
            open={true}
            className="no-shadow meet-radius border border-norm"
            rootClassName="meeting-created-modal-backdrop"
            onClose={onClose}
        >
            <ModalTwoHeader closeButtonProps={{ className: 'rounded-full' }} />
            <ModalTwoContent className="flex flex-column items-center justify-center">
                <div className="text-3xl text-semibold text-center mb-4">{c('Info').t`Meeting created`}</div>
                <div
                    className="bg-weak border border-norm h-custom meet-radius flex flex-column items-start justify-space-between p-4 overflow-hidden"
                    style={{ '--h-custom': '12rem' }}
                >
                    <div className="flex flex-column items-start">
                        <div className="text-lg text-semibold">{meetingName}</div>
                    </div>

                    <div className="flex flex-column items-start">
                        {endsOnSameDay ? (
                            <div className="flex flex-column items-start color-weak">
                                <div>{formatDate(startTime, timeZone)}</div>
                                <div>
                                    {formatTimeHHMM(startTime, timeFormat, timeZone)} -{' '}
                                    {formatTimeHHMM(endTime, timeFormat, timeZone)} ({timeZone})
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-column items-start color-weak">
                                <div>
                                    {formatDate(startTime, timeZone)} {formatTimeHHMM(startTime, timeFormat, timeZone)}{' '}
                                    ({timeZone})
                                </div>
                                <div>
                                    {formatDate(endTime, timeZone)} {formatTimeHHMM(endTime, timeFormat, timeZone)} (
                                    {timeZone})
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-row justify-between">
                        <span>
                            <a className="meeting-link" href={meetingLink} target="_blank" rel="noopener noreferrer">
                                {meetingLink}
                            </a>
                            <IcSquares
                                className="ml-2"
                                onClick={() => {
                                    void navigator.clipboard.writeText(meetingLink);
                                }}
                            />
                        </span>
                    </div>
                </div>
                <div className="w-full flex flex-nowrap flex-row mt-5 gap-4">
                    <div className="w-1/2">
                        <DropdownButton
                            ref={anchorRef}
                            isOpen={isOpen}
                            onClick={toggle}
                            className="w-full secondary-action-button rounded-full"
                        >
                            <span className="inline-flex items-center">
                                <IcPlus size={4} className="mr-2" />
                                {c('Label').t`Add to calendar`}
                            </span>
                        </DropdownButton>
                        <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                            <DropdownMenu>
                                <DropdownMenuButton
                                    className="text-left flex justify-between items-center w-full"
                                    key="outlook-calendar"
                                    onClick={handleOutlookDeepLink}
                                >
                                    {c('Label').t`Outlook calendar`}
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="text-left flex justify-between items-center w-full"
                                    key="google-calendar"
                                    onClick={handleGoogleDeepLink}
                                >
                                    {c('Label').t`Google calendar`}
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="text-left flex justify-between items-center w-full"
                                    key="ics"
                                    onClick={handleIcs}
                                >
                                    {c('Label').t`Download .ics`}
                                </DropdownMenuButton>
                                {isProtonCalendarDeepLinkEnabled && (
                                    <DropdownMenuButton
                                        className="text-left flex justify-between items-center w-full"
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
                        className="bg-primary rounded-full w-1/2"
                        onClick={() => {
                            onClose();
                            history.push('/dashboard');
                        }}
                        size="medium"
                    >{c('Action').t`Done`}</Button>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
