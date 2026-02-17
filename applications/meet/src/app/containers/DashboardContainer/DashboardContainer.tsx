import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useAppLink from '@proton/components/components/link/useAppLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getMeetingLink } from '@proton/meet';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectPreviousMeetingLink, selectUpsellModalType, setUpsellModalType } from '@proton/meet/store/slices';
import { APPS } from '@proton/shared/lib/constants';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import useFlag from '@proton/unleash/useFlag';

import { CTAModal } from '../../components/AnonymousModal/CTAModal';
import { CreateRoomModal } from '../../components/CreateRoomModal/CreateRoomModal';
import { JoinWithLinkModal } from '../../components/JoinWithLinkModal/JoinWithLinkModal';
import { PersonalMeetingModal } from '../../components/PersonalMeetingModal/PersonalMeetingModal';
import { ScheduleMeetingModal } from '../../components/ScheduleMeetingModal/ScheduleMeetingModal';
import { useDependencySetup } from '../../hooks/useDependencySetup';
import { DashboardContainerBody } from './DashboardContainerBody';

export const DashboardContainer = () => {
    const upsellModalType = useMeetSelector(selectUpsellModalType);
    const previousMeetingLink = useMeetSelector(selectPreviousMeetingLink);
    const dispatch = useMeetDispatch();

    const [{ open: isPersonalMeetingModalOpen, onClose: handlePersonalMeetingModalClose }, openPersonalMeetingModal] =
        useModalState();
    const [{ open: isJoinWithLinkModalOpen, onClose: handleJoinWithLinkModalClose }, openJoinWithLinkModal] =
        useModalState();
    const [{ open: isCreateRoomModalOpen, onClose: handleCreateRoomModalClose }, openCreateRoomModal] = useModalState();
    const [{ open: isScheduleMeetingModalOpen, onClose: handleScheduleMeetingModalClose }, openScheduleMeetingModal] =
        useModalState();
    const notifications = useNotifications();
    const history = useHistory();

    const [editedRoom, setEditedRoom] = useState<Meeting | null>(null);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | undefined>();

    const { meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting, meetingsListStatus } =
        useDependencySetup(false);

    const goToApp = useAppLink();

    const isScheduleEnabled = useFlag('NewScheduleOption');
    const isScheduleInAdvanceEnabled = useFlag('MeetScheduleInAdvance');

    const [user] = useUser();

    const handleScheduleInCalendar = () => {
        goToApp(
            `/?action=create&videoConferenceProvider=2&email=${encodeURIComponent(user.Email)}`,
            APPS.PROTONCALENDAR,
            true
        );
    };

    const handleScheduleMeeting = (meeting?: Meeting) => {
        if (!isScheduleEnabled) {
            notifications.createNotification({
                key: 'schedule-meeting-disabled',
                text: c('Notification').t`Coming soon`,
                type: 'info',
            });

            return;
        }

        if (!isScheduleInAdvanceEnabled) {
            handleScheduleInCalendar();
            return;
        }

        setSelectedMeetingId(meeting?.ID);
        openScheduleMeetingModal(true);
    };

    const handleStartMeeting = () => {
        history.push('/join');
    };

    const personalMeetingLinkPath = getMeetingLink(
        personalMeeting?.MeetingLinkName as string,
        personalMeeting?.Password as string
    );

    const personalMeetingLink = personalMeeting ? `${window.location.origin}${personalMeetingLinkPath}` : null;

    const handleRejoin = () => {
        history.push('/join');
    };

    const selectedMeeting = selectedMeetingId
        ? meetings?.find((meeting) => meeting.ID === selectedMeetingId)
        : undefined;

    return (
        <>
            <DashboardContainerBody
                onScheduleClick={handleScheduleMeeting}
                onPersonalMeetingClick={() => openPersonalMeetingModal(true)}
                onJoinWithLinkClick={() => openJoinWithLinkModal(true)}
                onStartMeetingClick={handleStartMeeting}
                onCreateRoomClick={() => openCreateRoomModal(true)}
                meetings={meetings ?? []}
                isGuest={false}
                handleScheduleInCalendar={handleScheduleInCalendar}
                handleNewRoomClick={(room?: Meeting) => {
                    if (room) {
                        setEditedRoom(room);
                    }

                    openCreateRoomModal(true);
                }}
                handleRotatePersonalMeeting={setupNewPersonalMeeting}
                loadingRotatePersonalMeeting={loadingRotatePersonalMeeting}
                meetingsListStatus={meetingsListStatus}
            />
            {upsellModalType && (
                <CTAModal
                    open={!!upsellModalType}
                    ctaModalType={upsellModalType}
                    onClose={() => dispatch(setUpsellModalType(null))}
                    rejoin={previousMeetingLink ? handleRejoin : undefined}
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
            <JoinWithLinkModal
                open={isJoinWithLinkModalOpen}
                onClose={handleJoinWithLinkModalClose}
                onJoin={(meetingId, meetingPassword) => history.push(getMeetingLink(meetingId, meetingPassword))}
            />
            <CreateRoomModal
                open={isCreateRoomModalOpen}
                onClose={() => {
                    setEditedRoom(null);
                    handleCreateRoomModalClose();
                }}
                editedRoom={editedRoom}
            />
            <ScheduleMeetingModal
                open={isScheduleMeetingModalOpen}
                onClose={handleScheduleMeetingModalClose}
                meeting={selectedMeeting}
                onMeetingCreated={setSelectedMeetingId}
            />
        </>
    );
};
