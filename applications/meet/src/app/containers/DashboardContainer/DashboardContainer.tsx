import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useAppLink from '@proton/components/components/link/useAppLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getMeetingLink } from '@proton/meet';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectUpsellModalType, setUpsellModalType } from '@proton/meet/store/slices';
import { APPS } from '@proton/shared/lib/constants';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';
import useFlag from '@proton/unleash/useFlag';

import { CTAModal } from '../../components/AnonymousModal/CTAModal';
import { JoinWithLinkModal } from '../../components/JoinWithLinkModal/JoinWithLinkModal';
import { PersonalMeetingModal } from '../../components/PersonalMeetingModal/PersonalMeetingModal';
import { useDependencySetup } from '../../hooks/useDependencySetup';
import { getNextOccurrence } from '../../utils/getNextOccurrence';
import { DashboardContainerBody } from './DashboardContainerBody';

export const DashboardContainer = () => {
    const upsellModalType = useMeetSelector(selectUpsellModalType);
    const dispatch = useMeetDispatch();

    const [{ open: isPersonalMeetingModalOpen, onClose: handlePersonalMeetingModalClose }, openPersonalMeetingModal] =
        useModalState();
    const [{ open: isJoinWithLinkModalOpen, onClose: handleJoinWithLinkModalClose }, openJoinWithLinkModal] =
        useModalState();

    const notifications = useNotifications();
    const history = useHistory();

    const { meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting } =
        useDependencySetup(false);

    const goToApp = useAppLink();

    const isScheduleEnabled = useFlag('NewScheduleOption');
    const isScheduleInAdvanceEnabled = useFlag('MeetScheduleInAdvance');

    const [user] = useUser();

    const handleScheduleMeeting = () => {
        if (!isScheduleEnabled) {
            notifications.createNotification({
                key: 'schedule-meeting-disabled',
                text: c('Notification').t`Coming soon`,
                type: 'info',
            });

            return;
        }

        if (!isScheduleInAdvanceEnabled) {
            goToApp(
                `/?action=create&videoConferenceProvider=2&email=${encodeURIComponent(user.Email)}`,
                APPS.PROTONCALENDAR,
                true
            );
        }

        history.push('/schedule/create');
    };

    const handleStartMeeting = () => {
        history.push('/join');
    };

    const upcomingMeetings = (meetings ?? [])
        ?.filter((meeting) => {
            return (
                (meeting.Type === MeetingType.SCHEDULED || meeting.Type === MeetingType.RECURRING) && meeting.StartTime
            );
        })
        .map((meeting) => {
            const occurrence = getNextOccurrence(meeting);
            return {
                ...meeting,
                adjustedStartTime: occurrence.startTime,
                adjustedEndTime: occurrence.endTime,
            };
        })
        .sort((a, b) => {
            return a.adjustedStartTime - b.adjustedStartTime;
        });

    const personalMeetingLinkPath = getMeetingLink(
        personalMeeting?.MeetingLinkName as string,
        personalMeeting?.Password as string
    );

    const personalMeetingLink = personalMeeting ? `${window.location.origin}${personalMeetingLinkPath}` : null;

    const handleRejoin = () => {
        history.push('/join');
    };

    return (
        <>
            <DashboardContainerBody
                onScheduleClick={handleScheduleMeeting}
                onPersonalMeetingClick={() => openPersonalMeetingModal(true)}
                onJoinWithLinkClick={() => openJoinWithLinkModal(true)}
                onStartMeetingClick={handleStartMeeting}
                upcomingMeetings={upcomingMeetings}
                meetings={meetings ?? []}
                isGuest={false}
            />
            {upsellModalType && (
                <CTAModal
                    ctaModalType={upsellModalType}
                    onClose={() => dispatch(setUpsellModalType(null))}
                    rejoin={handleRejoin}
                    action={() => {}}
                />
            )}
            {isPersonalMeetingModalOpen && personalMeetingLink && (
                <PersonalMeetingModal
                    onClose={handlePersonalMeetingModalClose}
                    onCopyLink={() => {
                        void navigator.clipboard.writeText(personalMeetingLink);
                        notifications.createNotification({
                            key: 'personal-meeting-link-copied',
                            text: c('Notification').t`Your personal meeting link has been copied to the clipboard`,
                            type: 'info',
                        });
                        handlePersonalMeetingModalClose();
                    }}
                    onJoin={() => {
                        history.push(personalMeetingLinkPath);
                    }}
                    onRotate={setupNewPersonalMeeting}
                    link={personalMeetingLink}
                    loadingRotatePersonalMeeting={loadingRotatePersonalMeeting}
                />
            )}
            {isJoinWithLinkModalOpen && (
                <JoinWithLinkModal
                    onClose={handleJoinWithLinkModalClose}
                    onJoin={(meetingId, meetingPassword) => history.push(getMeetingLink(meetingId, meetingPassword))}
                />
            )}
        </>
    );
};
