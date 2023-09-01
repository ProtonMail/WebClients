import { c, msgid } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';

import { InlineLinkButton, SettingsLink, useModalState } from '../../components';
import {
    useConfig,
    useIsSessionRecoveryInitiatedByCurrentSession,
    useSessionRecoveryGracePeriodHoursRemaining,
    useSessionRecoveryInsecureTimeRemaining,
    useShouldNotifyPasswordResetAvailable,
    useShouldNotifySessionRecoveryInProgress,
    useUser,
} from '../../hooks';
import { SessionRecoveryInProgressModal } from '../account';
import PasswordResetAvailableAccountModal from '../account/sessionRecovery/PasswordResetAvailableAccountModal';
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

const PasswordResetAvailableBanner = () => {
    const timeRemaining = useSessionRecoveryInsecureTimeRemaining();
    const isSessionRecoveryInitiatedByCurrentSession = useIsSessionRecoveryInitiatedByCurrentSession();
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const [
        passwordResetAvailableAccountModal,
        setPasswordResetAvailableAccountModalOpen,
        renderPasswordResetAvailableAccountModal,
    ] = useModalState();

    if (timeRemaining === null) {
        return null;
    }

    const cta =
        APP_NAME === APPS.PROTONACCOUNT ? (
            <InlineLinkButton key="reset-password" onClick={() => setPasswordResetAvailableAccountModalOpen(true)}>
                {isSessionRecoveryInitiatedByCurrentSession ? c('Action').t`Reset password` : c('Action').t`See how`}
            </InlineLinkButton>
        ) : (
            <SettingsLink
                key="reset-password"
                path="/account-password?action=session-recovery-password-reset-available"
            >
                {c('Action').t`See how`}
            </SettingsLink>
        );

    const message = (() => {
        if (isSessionRecoveryInitiatedByCurrentSession) {
            return timeRemaining.inDays === 0
                ? // translator: Full sentence "Password reset request approved (user@email.com). You have N hours to reset your password."
                  c('Session recovery').ngettext(
                      msgid`Password reset request approved (${user.Email}). You have ${timeRemaining.inHours} hour to reset your password.`,
                      `Password reset request approved (${user.Email}). You have ${timeRemaining.inHours} hours to reset your password.`,
                      timeRemaining.inHours
                  )
                : // translator: Full sentence "Password reset request approved (user@email.com). You have N days to reset your password."
                  c('Session recovery').ngettext(
                      msgid`Password reset request approved (${user.Email}). You have ${timeRemaining.inDays} day to reset your password.`,
                      `Password reset request approved (${user.Email}). You have ${timeRemaining.inDays} days to reset your password.`,
                      timeRemaining.inDays
                  );
        }

        return timeRemaining.inDays === 0
            ? // translator: Full sentence "Password reset request approved (user@email.com). You have N hours to reset your password from the session where the request was initiated."
              c('Session recovery').ngettext(
                  msgid`Password reset request approved (${user.Email}). You have ${timeRemaining.inHours} hour to reset your password from the session where the request was initiated.`,
                  `Password reset request approved (${user.Email}). You have ${timeRemaining.inHours} hours to reset your password from the session where the request was initiated.`,
                  timeRemaining.inHours
              )
            : // translator: Full sentence "Password reset request approved (user@email.com). You have N days to reset your password."
              c('Session recovery').ngettext(
                  msgid`Password reset request approved (${user.Email}). You have ${timeRemaining.inDays} day to reset your password from the session where the request was initiated.`,
                  `Password reset request approved (${user.Email}). You have ${timeRemaining.inDays} days to reset your password from the session where the request was initiated.`,
                  timeRemaining.inDays
              );
    })();

    return (
        <>
            {renderPasswordResetAvailableAccountModal && (
                <PasswordResetAvailableAccountModal {...passwordResetAvailableAccountModal} />
            )}
            <TopBanner className="bg-success">
                {message} {cta}
            </TopBanner>
        </>
    );
};

const SessionRecoveryBanners = () => {
    const shouldNotifyPasswordResetAvailable = useShouldNotifyPasswordResetAvailable();
    const shouldNotifySessionRecoveryInProgress = useShouldNotifySessionRecoveryInProgress();

    return (
        <>
            {shouldNotifySessionRecoveryInProgress && <SessionRecoveryInProgressBanner />}
            {shouldNotifyPasswordResetAvailable && <PasswordResetAvailableBanner />}
        </>
    );
};

export default SessionRecoveryBanners;
