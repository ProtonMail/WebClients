import { c, msgid } from 'ttag';

import { InlineLinkButton, useModalState } from '../../components';
import {
    useSessionRecoveryGracePeriodHoursRemaining,
    useShouldNotifySessionRecoveryInProgress,
    useUser,
} from '../../hooks';
import { SessionRecoveryInProgressModal } from '../account';
import TopBanner from './TopBanner';

const SessionRecoveryInProgressBanner = () => {
    const hoursRemaining = useSessionRecoveryGracePeriodHoursRemaining();
    const [user] = useUser();
    const [
        sessionRecoveryInProgressModal,
        setSessionRecoveryInProgressModalOpen,
        renderSessionRecoveryInProgressModal,
    ] = useModalState();

    if (hoursRemaining === null) {
        return null;
    }

    const readMore = (
        <InlineLinkButton key="read-more" onClick={() => setSessionRecoveryInProgressModalOpen(true)}>
            {c('Action').t`Learn more`}
        </InlineLinkButton>
    );

    return (
        <>
            {renderSessionRecoveryInProgressModal && (
                <SessionRecoveryInProgressModal {...sessionRecoveryInProgressModal} />
            )}
            <TopBanner className="bg-warning">
                {
                    // translator: Full sentence "Password reset requested (user@email.com). You can change your password in 72 hours."
                    c('Session recovery').ngettext(
                        msgid`Password reset requested (${user.Email}). You can change your password in ${hoursRemaining} hour.`,
                        `Password reset requested (${user.Email}). You can change your password in ${hoursRemaining} hours.`,
                        hoursRemaining
                    )
                }{' '}
                {readMore}
            </TopBanner>
        </>
    );
};

const SessionRecoveryBanners = () => {
    const shouldNotifySessionRecoveryInProgress = useShouldNotifySessionRecoveryInProgress();

    return <>{shouldNotifySessionRecoveryInProgress && <SessionRecoveryInProgressBanner />}</>;
};

export default SessionRecoveryBanners;
