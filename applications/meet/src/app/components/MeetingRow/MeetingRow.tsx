import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useAppLink from '@proton/components/components/link/useAppLink';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcPenSquare } from '@proton/icons';
import { getMeetingLink } from '@proton/meet';
import { PASSWORD_SEPARATOR } from '@proton/meet/utils/cryptoUtils';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import clsx from '@proton/utils/clsx';

import { getNextOccurrence } from '../../utils/getNextOccurrence';

import './MeetingRow.scss';

interface MeetingRowProps {
    meeting: Meeting & { adjustedStartTime?: number };
    index: number;
}

export const MeetingRow = ({ meeting, index }: MeetingRowProps) => {
    const history = useHistory();

    const notifications = useNotifications();

    const goToApp = useAppLink();

    const colorIndex = (index % 6) + 1;

    const { month, day, startTime, endTime } = useMemo(() => {
        // Use the pre-calculated adjusted time if available, otherwise calculate it
        const nextOccurrenceTime = meeting.adjustedStartTime ?? getNextOccurrence(meeting);
        const startDate = new Date(1000 * nextOccurrenceTime);
        const endDate = meeting.EndTime ? new Date(1000 * Number(meeting.EndTime)) : null;

        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const startTime = startDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: userTimeZone,
        });

        const endTime = endDate
            ? endDate.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: userTimeZone,
              })
            : null;

        const month = startDate.toLocaleDateString(undefined, {
            month: 'short',
            timeZone: userTimeZone,
        });

        const day = startDate.toLocaleDateString(undefined, {
            day: 'numeric',
            timeZone: userTimeZone,
        });

        return { month, day, startTime, endTime };
    }, [meeting.adjustedStartTime, meeting.EndTime]);

    const meetingLink = getMeetingLink(meeting.MeetingLinkName, meeting.Password?.split(PASSWORD_SEPARATOR)[0] ?? '');

    const handleJoin = () => {
        history.push(meetingLink);
    };

    const handleCopyLink = () => {
        const fullMeetingLink = getAppHref(meetingLink, APPS.PROTONMEET);
        void navigator.clipboard.writeText(fullMeetingLink);
        notifications.createNotification({
            key: 'link-copied',
            text: c('Notification').t`Link copied to clipboard`,
        });
    };

    const handleEditMeeting = () => {
        if (meeting.CalendarEventID && meeting.CalendarID) {
            goToApp(
                `/?action=edit&eventId=${meeting.CalendarEventID}&calendarId=${meeting.CalendarID}`,
                APPS.PROTONCALENDAR,
                true
            );
        }
    };

    return (
        <div
            className="meeting-row border w-full flex flex-column md:flex-row flex-nowrap justify-centet items-start md:items-center md:justify-space-between gap-6 min-h-custom p-6 md:p-8 h-fit-content shrink-0"
            style={{ '--min-h-custom': '8.25rem' }}
        >
            <div className="flex flex-column md:flex-row items-start md:items-center gap-2 shrink-0 gap-6">
                <div
                    className={clsx(
                        'flex flex-column items-center justify-center w-custom h-custom meet-radius',
                        `meet-background-${colorIndex}`,
                        `profile-color-${colorIndex}`
                    )}
                    style={{ '--w-custom': '4.25rem', '--h-custom': '4.25rem' }}
                >
                    <div className="text-lg">{month}</div>
                    <div className="color-norm text-xl">{day}</div>
                </div>
                <div className="flex flex-column gap-2">
                    <div className="text-xl color-norm text-semibold">
                        {meeting.MeetingName ? meeting.MeetingName : c('Title').t`Secure meeting`}
                    </div>
                    <div className="color-weak">
                        {startTime} {endTime ? `- ${endTime}` : ''}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <Button
                    className="border-none rounded-full copy-link-button min-w-custom flex-1 md:flex-none"
                    style={{ '--min-w-custom': '7.125rem' }}
                    size="large"
                    onClick={handleCopyLink}
                >
                    {c('Action').t`Copy link`}
                </Button>
                <Button
                    className="border-none rounded-full join-button min-w-custom flex-1 md:flex-none"
                    style={{ '--min-w-custom': '7.125rem' }}
                    size="large"
                    onClick={handleJoin}
                >
                    {c('Action').t`Join`}
                </Button>
                <Button
                    className="color-disabled rounded-full w-custom h-custom"
                    size="small"
                    shape="ghost"
                    onClick={() => handleEditMeeting()}
                    style={{ '--w-custom': '2.75rem', '--h-custom': '2.75rem' }}
                >
                    <IcPenSquare size={5} />
                </Button>
            </div>
        </div>
    );
};
