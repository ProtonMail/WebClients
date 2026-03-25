import { useHistory } from 'react-router-dom';

import useAppLink from '@proton/components/components/link/useAppLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import { getMeetingLink } from '@proton/meet';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectPreviousMeetingLink, selectUpsellModalType, setUpsellModalType } from '@proton/meet/store/slices';
import { UpsellModalTypes } from '@proton/meet/types/types';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMeet } from '@proton/shared/lib/helpers/desktop';

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
        } else {
            history.push('/join');
        }
    };

    const handleStartMeeting = () => {
        history.push('/join');
    };

    const handleCreateAccount = () => {
        if (isElectronMeet) {
            openLinkInBrowser(getAppHref('/meet/signup', APPS.PROTONACCOUNT));
            return;
        }
        goToApp('/meet/signup', APPS.PROTONACCOUNT, true);
    };

    const [{ open: isJoinWithLinkModalOpen, onClose: handleJoinWithLinkModalClose }, openJoinWithLinkModal] =
        useModalState();

    return (
        <>
            <DashboardContainerBody
                onScheduleClick={() => {
                    dispatch(setUpsellModalType(UpsellModalTypes.Schedule));
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
                    open={!!upsellModalType}
                    ctaModalType={upsellModalType}
                    onClose={() => dispatch(setUpsellModalType(null))}
                    rejoin={previousMeetingLink ? handleRejoin : undefined}
                    action={handleCreateAccount}
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
