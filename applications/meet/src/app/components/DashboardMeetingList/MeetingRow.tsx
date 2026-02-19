import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useAppLink from '@proton/components/components/link/useAppLink';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcMeetUsers } from '@proton/icons/icons/IcMeetUsers';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { getMeetingLink } from '@proton/meet';
import { PASSWORD_SEPARATOR } from '@proton/meet/utils/cryptoUtils';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';
import { type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { getRotatePersonalMeetingDisabledUntil } from '../../utils/disableRotatePersonalMeeting';
import { getNextOccurrence } from '../../utils/getNextOccurrence';
import { DeleteMeetingModal } from '../DeleteMeetingModal/DeleteMeetingModal';

import './MeetingRow.scss';

interface MeetingRowProps {
    meeting: Meeting & { adjustedStartTime?: number; adjustedEndTime?: number };
    index: number;
    isFirst?: boolean;
    isLast?: boolean;
    isRoom?: boolean;
    getSubtitle?: (meeting: Meeting, dateFormat: SETTINGS_DATE_FORMAT) => string;
    handleEditRoom?: (room: Meeting) => void;
    handleEditScheduleMeeting?: (meeting: Meeting) => void;
    handleRotatePersonalMeeting?: () => void;
    loadingRotatePersonalMeeting?: boolean;
}

export const MeetingRow = ({
    meeting,
    index,
    isFirst = true,
    isLast = true,
    isRoom = false,
    getSubtitle,
    handleEditRoom,
    handleEditScheduleMeeting,
    handleRotatePersonalMeeting,
    loadingRotatePersonalMeeting = false,
}: MeetingRowProps) => {
    const isPersonalMeetingRotationEnabled = useFlag('PersonalMeetingRotation');

    const isRotationDisabled = () => {
        const disabledUntil = getRotatePersonalMeetingDisabledUntil();
        return !!disabledUntil && disabledUntil > Date.now();
    };

    const [isRotateButtonDisabled, setIsRotateButtonDisabled] = useState(isRotationDisabled);

    const checkDisableStatus = () => {
        setIsRotateButtonDisabled(isRotationDisabled());
    };

    useEffect(() => {
        const interval = setInterval(checkDisableStatus, 30_000);
        return () => clearInterval(interval);
    }, []);

    const history = useHistory();
    const [isDeleteMeetingModalOpen, setIsDeleteMeetingModalOpen] = useState(false);
    const notifications = useNotifications();

    const goToApp = useAppLink();

    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const dateFormat = userSettings.DateFormat;

    const colorIndex = (index % 6) + 1;

    const { month, day, startTime, endTime } = useMemo(() => {
        // Use the pre-calculated adjusted time if available, otherwise calculate it
        const occurrence =
            !!meeting.adjustedStartTime && !!meeting.adjustedEndTime
                ? { startTime: meeting.adjustedStartTime, endTime: meeting.adjustedEndTime }
                : getNextOccurrence(meeting);
        const startDate = new Date(1000 * occurrence.startTime);
        const endDate = new Date(1000 * occurrence.endTime);

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
    }, [meeting.adjustedStartTime, meeting.adjustedEndTime, meeting.EndTime]);

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
        if (isRoom && handleEditRoom) {
            handleEditRoom(meeting);
            return;
        }

        if (meeting.CalendarEventID && meeting.CalendarID) {
            goToApp(
                `/?action=edit&eventId=${meeting.CalendarEventID}&calendarId=${meeting.CalendarID}&email=${encodeURIComponent(user.Email)}`,
                APPS.PROTONCALENDAR,
                true
            );
        }

        if (
            (meeting.Type === MeetingType.RECURRING || meeting.Type === MeetingType.SCHEDULED) &&
            handleEditScheduleMeeting
        ) {
            handleEditScheduleMeeting(meeting);
            return;
        }
    };

    const handleRotate = () => {
        if (!handleRotatePersonalMeeting) {
            return;
        }
        setIsRotateButtonDisabled(true);
        handleRotatePersonalMeeting();
    };

    const roomLabel =
        meeting.Type === MeetingType.PERSONAL
            ? c('Info').t`Your always available meeting room`
            : getSubtitle?.(meeting, dateFormat);

    return (
        <>
            <div
                className={clsx(
                    'meeting-row border border-card w-full flex flex-column *:min-size-auto md:flex-row flex-nowrap justify-center items-start md:items-center md:justify-space-between gap-6 min-h-custom p-4 md:p-6 h-fit-content shrink-0 relative',
                    isFirst && 'meeting-row--first',
                    isFirst && isRoom && 'personal-meeting-row',
                    isLast && !isRoom && 'meeting-row--last',
                    isLast && isRoom && 'meeting-row--last-room'
                )}
                style={{ '--min-h-custom': '6.75rem' }}
            >
                <div className="flex md:flex-row flex-1 items-start md:items-center shrink-0 gap-6">
                    <div
                        className={clsx(
                            'flex flex-column flex-nowrap items-center justify-center w-custom h-custom profile-radius color-white shrink-0',
                            isRoom && `meet-room-background-${colorIndex}`,
                            !isRoom && `meet-background-${colorIndex}`
                        )}
                        style={{ '--w-custom': '3.75rem', '--h-custom': '3.75rem' }}
                    >
                        {isRoom ? (
                            <IcMeetUsers size={6} />
                        ) : (
                            <>
                                <div
                                    className={clsx(
                                        'text-xs text-semibold text-uppercase',
                                        !isRoom && `profile-color-${colorIndex}`
                                    )}
                                >
                                    {month}
                                </div>
                                <div className="color-norm text-semibold text-lg">{day}</div>
                            </>
                        )}
                    </div>
                    <div className="flex-1 flex flex-column flex-nowrap *:min-size-auto gap-1">
                        <div className="text-lg color-norm text-semibold text-break">
                            {meeting.MeetingName ? meeting.MeetingName : c('Title').t`Secure meeting`}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="color-hint">
                                {isRoom ? (
                                    <>{roomLabel}</>
                                ) : (
                                    <>
                                        {startTime} {endTime ? `- ${endTime}` : ''}
                                    </>
                                )}
                            </span>
                            {meeting.RRule && !isRoom && (
                                <Tooltip
                                    title={c('Tooltip').t`Recurring meeting`}
                                    tooltipClassName="meet-tooltip bg-strong color-norm"
                                    tooltipStyle={{ '--meet-tooltip-bg': 'var(--background-strong)' }}
                                >
                                    <div>
                                        <IcArrowsRotate className="color-hint" size={4} />
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <div
                        className="hidden-meeting-row-actions gap-3 grow-custom md:grow-1 items-center color-norm flex flex-1 md:flex-none"
                        style={{ '--grow-custom': '3' }}
                    >
                        {meeting.Type !== MeetingType.PERSONAL && (
                            <>
                                <Button
                                    className="action-button-new meeting-row-action color-norm rounded-full flex-1 md:flex-none delete-button"
                                    size="medium"
                                    shape="ghost"
                                    icon
                                    onClick={() => setIsDeleteMeetingModalOpen(true)}
                                >
                                    <IcTrash alt={c('Action').t`Delete meeting`} className="m-auto" />
                                </Button>

                                <Button
                                    className="action-button-new meeting-row-action color-norm rounded-full flex-1 md:flex-none"
                                    size="medium"
                                    shape="ghost"
                                    icon
                                    onClick={() => handleEditMeeting()}
                                >
                                    <IcPenSquare alt={c('Action').t`Edit meeting`} className="m-auto" />
                                </Button>
                            </>
                        )}
                        {meeting.Type === MeetingType.PERSONAL &&
                            isPersonalMeetingRotationEnabled &&
                            !!handleRotatePersonalMeeting && (
                                <Button
                                    className={clsx(
                                        'action-button-new meeting-row-action color-norm rounded-full flex-1 md:flex-none flex justify-center items-center',
                                        loadingRotatePersonalMeeting && 'icon-rotating'
                                    )}
                                    size="medium"
                                    shape="ghost"
                                    icon
                                    onClick={handleRotate}
                                    disabled={loadingRotatePersonalMeeting || isRotateButtonDisabled}
                                >
                                    <IcArrowsRotate alt={c('Action').t`Rotate personal meeting link`} />
                                </Button>
                            )}
                    </div>
                    <Button
                        className="action-button-new meeting-row-action color-norm rounded-full copy-link-button flex-1 md:flex-none flex justify-center items-center"
                        size="medium"
                        onClick={handleCopyLink}
                        icon
                    >
                        <IcSquares alt={c('Action').t`Copy meeting link`} />
                    </Button>
                    <Button
                        className="join-button action-button-new color-norm rounded-full join-button flex-1 md:flex-none flex items-center justify-center"
                        onClick={handleJoin}
                    >
                        {c('Action').t`Join`}
                    </Button>
                </div>
            </div>
            {isDeleteMeetingModalOpen && (
                <DeleteMeetingModal
                    meetingId={meeting.ID}
                    onClose={() => setIsDeleteMeetingModalOpen(false)}
                    isRoom={isRoom}
                />
            )}
        </>
    );
};
