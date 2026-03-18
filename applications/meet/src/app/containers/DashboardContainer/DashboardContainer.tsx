import { useEffect, useState } from 'react';
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
import { useFlag } from '@proton/unleash/useFlag';

import { CTAModal } from '../../components/AnonymousModal/CTAModal';
import { CreateRoomModal } from '../../components/CreateRoomModal/CreateRoomModal';
import { JoinWithLinkModal } from '../../components/JoinWithLinkModal/JoinWithLinkModal';
import { ScheduleMeetingModal } from '../../components/ScheduleMeetingModal/ScheduleMeetingModal';
import { useDependencySetup } from '../../hooks/useDependencySetup';
import { DashboardContainerBody } from './DashboardContainerBody';

export const DashboardContainer = () => {
    const upsellModalType = useMeetSelector(selectUpsellModalType);
    const previousMeetingLink = useMeetSelector(selectPreviousMeetingLink);
    const dispatch = useMeetDispatch();

    const [{ open: isJoinWithLinkModalOpen, onClose: handleJoinWithLinkModalClose }, openJoinWithLinkModal] =
        useModalState();
    const [{ open: isCreateRoomModalOpen, onClose: handleCreateRoomModalClose }, openCreateRoomModal] = useModalState();
    const [{ open: isScheduleMeetingModalOpen, onClose: handleScheduleMeetingModalClose }, openScheduleMeetingModal] =
        useModalState();
    const notifications = useNotifications();
    const history = useHistory();

    const [editedRoom, setEditedRoom] = useState<Meeting | null>(null);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | undefined>();
    const [newlyCreatedMeetingId, setNewlyCreatedMeetingId] = useState<string | undefined>();

    const { meetings, setupNewPersonalMeeting, loadingRotatePersonalMeeting, meetingsListStatus } =
        useDependencySetup();

    useEffect(() => {
        if (!newlyCreatedMeetingId) {
            return;
        }
        const timeoutId = setTimeout(() => setNewlyCreatedMeetingId(undefined), 5000);
        return () => clearTimeout(timeoutId);
    }, [newlyCreatedMeetingId]);

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

    const handleRejoin = () => {
        if (previousMeetingLink) {
            history.push(previousMeetingLink);
        } else {
            history.push('/join');
        }
    };

    const selectedMeeting = selectedMeetingId
        ? meetings?.find((meeting) => meeting.ID === selectedMeetingId)
        : undefined;

    return (
        <>
            <DashboardContainerBody
                onScheduleClick={handleScheduleMeeting}
                onJoinWithLinkClick={() => openJoinWithLinkModal(true)}
                onStartMeetingClick={handleStartMeeting}
                onCreateRoomClick={() => openCreateRoomModal(true)}
                meetings={meetings ?? []}
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
                newlyCreatedMeetingId={newlyCreatedMeetingId}
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
                onMeetingCreated={(id) => {
                    setSelectedMeetingId(id);
                    setNewlyCreatedMeetingId(id);
                }}
            />
        </>
    );
};
