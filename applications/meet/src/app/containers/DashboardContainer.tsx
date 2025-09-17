import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import useAppLink from '@proton/components/components/link/useAppLink';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCalendarToday, IcPhone, IcUser } from '@proton/icons';
import { getMeetingLink } from '@proton/meet';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import { CardButton } from '../atoms/CardButton/CardButton';
import { MeetingRow } from '../components/MeetingRow/MeetingRow';
import { NoUpcomingMeetings } from '../components/NoUpcomingMeetings/NoUpcomingMeetings';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { PersonalMeetingModal } from '../components/PersonalMeetingModal/PersonalMeetingModal';
import { useDependencySetup } from '../hooks/useDependencySetup';

export const DashboardContainer = () => {
    const [isPersonalMeetingModalOpen, setIsPersonalMeetingModalOpen] = useState(false);

    const notifications = useNotifications();
    const history = useHistory();

    const { meetings, personalMeeting } = useDependencySetup(false);

    const goToApp = useAppLink();

    const isScheduleEnabled = useFlag('NewScheduleOption');

    const handleScheduleMeeting = () => {
        if (!isScheduleEnabled) {
            notifications.createNotification({
                key: 'schedule-meeting-disabled',
                text: c('Notification').t`Coming soon`,
                type: 'info',
            });

            return;
        }

        goToApp('/?action=create&videoConferenceProvider=2', APPS.PROTONCALENDAR, true);
    };

    const handleStartMeeting = () => {
        history.push('/join');
    };

    const upcomingMeetings = useMemo(
        () =>
            (meetings ?? [])
                ?.filter((meeting) => {
                    return (
                        (meeting.Type === MeetingType.SCHEDULED || meeting.Type === MeetingType.RECURRING) &&
                        meeting.StartTime
                    );
                })
                .sort((a, b) => {
                    return new Date(a.StartTime as string).getTime() - new Date(b.StartTime as string).getTime();
                }),
        [meetings]
    );

    const personalMeetingLinkPath = getMeetingLink(
        personalMeeting?.MeetingLinkName as string,
        personalMeeting?.Password as string
    );

    const personalMeetingLink = personalMeeting ? `${window.location.origin}${personalMeetingLinkPath}` : null;

    return (
        <div className="w-full h-full overflow-y-auto lg:overflow-y-hidden flex flex-column flex-nowrap bg-weak">
            {isPersonalMeetingModalOpen && personalMeetingLink && (
                <PersonalMeetingModal
                    onClose={() => setIsPersonalMeetingModalOpen(false)}
                    onCopyLink={() => {
                        void navigator.clipboard.writeText(personalMeetingLink);
                        notifications.createNotification({
                            key: 'personal-meeting-link-copied',
                            text: c('Notification').t`Your personal meeting link has been copied to the clipboard`,
                            type: 'info',
                        });
                        setIsPersonalMeetingModalOpen(false);
                    }}
                    onJoin={() => {
                        history.push(personalMeetingLinkPath);
                    }}
                    link={personalMeetingLink}
                />
            )}
            <PageHeader isScheduleInAdvanceEnabled={false} guestMode={false} />
            <div className="flex gap-4 p-4 flex-nowrap w-full shrink-0">
                <div className="flex flex-column md:flex-row flex-nowrap gap-1 md:gap-4 w-full">
                    <CardButton
                        className="w-full md:w-1/3"
                        title={c('Title').t`Schedule meeting`}
                        description={c('Description').t`Plan meetings and send invites with ${CALENDAR_APP_NAME}.`}
                        icon={<IcCalendarToday size={5} />}
                        circleColor="var(--ui-blue-interaction-minor-3)"
                        iconColor="var(--ui-blue-interaction-minor-1)"
                        onClick={handleScheduleMeeting}
                    />
                    <CardButton
                        className="w-full md:w-1/3"
                        title={c('Title').t`Personal meeting link`}
                        description={c('Description').t`An always available meeting room for people you trust.`}
                        icon={<IcUser size={5} />}
                        circleColor="var(--ui-purple-interaction-minor-3)"
                        iconColor="var(--ui-purple-interaction-minor-1)"
                        onClick={() => setIsPersonalMeetingModalOpen(true)}
                    />
                    <CardButton
                        className="w-full md:w-1/3"
                        title={c('Title').t`Start secure meeting`}
                        description={c('Description').t`Start a call immediately then share the link with others.`}
                        icon={<IcPhone size={5} />}
                        circleColor="var(--ui-green-interaction-minor-3)"
                        iconColor="var(--ui-green-interaction-minor-1)"
                        onClick={handleStartMeeting}
                    />
                </div>
            </div>
            <div className="flex flex-column gap-4 p-4 flex-nowrap w-full shrink-0">
                <div className="flex justify-start items-center w-full">
                    <div className="text-xl color-norm text-semibold">{c('Title').t`Upcoming meetings`}</div>
                    <div
                        className="flex items-center justify-center bg-strong rounded-full w-custom h-custom ml-2"
                        style={{ '--w-custom': '1.5rem', '--h-custom': '1.5rem' }}
                    >
                        {upcomingMeetings?.length ?? 0}
                    </div>
                </div>
            </div>
            <div className="flex flex-column shrink-0 lg:flex-1 w-full p-4">
                <div className="flex flex-column gap-4 flex-nowrap w-full h-full overflow-y-auto">
                    {meetings === null && (
                        <CircleLoader
                            className="color-primary w-custom h-custom m-auto"
                            style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
                        />
                    )}
                    {meetings && upcomingMeetings.length > 0 && (
                        <>
                            {upcomingMeetings.map((meeting, index) => (
                                <MeetingRow
                                    key={[meeting.ID, meeting.CalendarID, meeting.CalendarEventID]
                                        .filter(isTruthy)
                                        .join('-')}
                                    meeting={meeting}
                                    index={index}
                                />
                            ))}
                        </>
                    )}
                    {meetings && upcomingMeetings.length === 0 && (
                        <NoUpcomingMeetings onSchedule={handleScheduleMeeting} onStart={handleStartMeeting} />
                    )}
                </div>
            </div>
        </div>
    );
};
