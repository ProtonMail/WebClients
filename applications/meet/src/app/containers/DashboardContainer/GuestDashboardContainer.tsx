import { useHistory } from 'react-router-dom';

import useAppLink from '@proton/components/components/link/useAppLink';
import { APPS } from '@proton/shared/lib/constants';

import { CTAModal } from '../../components/AnonymousModal/CTAModal';
import { useMeetDispatch, useMeetSelector } from '../../store/hooks';
import {
    selectPreviousMeetingLink,
    selectUpsellModalType,
    setUpsellModalType,
} from '../../store/slices/meetAppStateSlice';
import { UpsellModalTypes } from '../../types';
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
                onJoinWithLinkClick={() => {}}
                onStartMeetingClick={() => {
                    dispatch(setUpsellModalType(UpsellModalTypes.StartMeeting));
                }}
                upcomingMeetings={[]}
                meetings={[]}
            />
            {upsellModalType && (
                <CTAModal
                    ctaModalType={upsellModalType}
                    onClose={() => dispatch(setUpsellModalType(null))}
                    rejoin={handleRejoin}
                    action={
                        upsellModalType === UpsellModalTypes.StartMeeting ? handleStartMeeting : handleCreateAccount
                    }
                />
            )}
        </>
    );
};
