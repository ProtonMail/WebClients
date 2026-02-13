import { useHistory } from 'react-router-dom';

import useAppLink from '@proton/components/components/link/useAppLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { getMeetingLink } from '@proton/meet';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectPreviousMeetingLink, selectUpsellModalType, setUpsellModalType } from '@proton/meet/store/slices';
import { UpsellModalTypes } from '@proton/meet/types/types';
import { APPS } from '@proton/shared/lib/constants';

import { CTAModal } from '../../components/AnonymousModal/CTAModal';
import { JoinWithLinkModal } from '../../components/JoinWithLinkModal/JoinWithLinkModal';
import { MeetingListStatus } from '../../hooks/useMeetingList';
import { DashboardContainerBody } from './DashboardContainerBody';

export const GuestDashboardContainer = () => {
    const history = useHistory();

    const previousMeetingLink = useMeetSelector(selectPreviousMeetingLink);
    const upsellModalType = useMeetSelector(selectUpsellModalType);
    const dispatch = useMeetDispatch();
    const goToApp = useAppLink();

    const handleRejoin = () => {
        if (previousMeetingLink) {
            history.push(previousMeetingLink);
        }
    };

    const handleStartMeeting = () => {
        history.push('/join');
    };

    const handleCreateAccount = () => {
        goToApp('/meet/signup', APPS.PROTONACCOUNT, true);
    };

    const [{ open: isJoinWithLinkModalOpen, onClose: handleJoinWithLinkModalClose }, openJoinWithLinkModal] =
        useModalState();

    return (
        <>
            <DashboardContainerBody
                isGuest={true}
                onScheduleClick={() => {
                    dispatch(setUpsellModalType(UpsellModalTypes.Schedule));
                }}
                onPersonalMeetingClick={() => {
                    dispatch(setUpsellModalType(UpsellModalTypes.PersonalMeeting));
                }}
                onJoinWithLinkClick={() => openJoinWithLinkModal(true)}
                handleNewRoomClick={() => {
                    dispatch(setUpsellModalType(UpsellModalTypes.Room));
                }}
                onStartMeetingClick={handleStartMeeting}
                onCreateRoomClick={() => {
                    dispatch(setUpsellModalType(UpsellModalTypes.Room));
                }}
                handleScheduleInCalendar={() => {}}
                meetings={[]}
                meetingsListStatus={MeetingListStatus.Done}
            />
            {upsellModalType && (
                <CTAModal
                    ctaModalType={upsellModalType}
                    onClose={() => dispatch(setUpsellModalType(null))}
                    rejoin={previousMeetingLink ? handleRejoin : undefined}
                    action={
                        upsellModalType === UpsellModalTypes.StartMeeting ? handleStartMeeting : handleCreateAccount
                    }
                />
            )}
            <JoinWithLinkModal
                open={isJoinWithLinkModalOpen}
                onClose={handleJoinWithLinkModalClose}
                onJoin={(meetingId, meetingPassword) => history.push(getMeetingLink(meetingId, meetingPassword))}
            />
        </>
    );
};
