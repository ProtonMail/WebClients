import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { SettingsLink } from '@proton/components/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useSessionRecoveryGracePeriodHoursRemaining, useSessionRecoveryState } from '@proton/components/hooks';
import { SessionRecoveryState } from '@proton/shared/lib/interfaces';

const GracePeriodText = () => {
    const gracePeriodHoursRemaining = useSessionRecoveryGracePeriodHoursRemaining();

    if (gracePeriodHoursRemaining === null) {
        return null;
    }

    const boldTimeLeft = (
        <b key="bold-time-left">
            {
                // translator: Full sentence is "You will be able to reset your password in XX hours."
                c('session_recovery:sign_out:info').ngettext(
                    msgid`${gracePeriodHoursRemaining} hour`,
                    `${gracePeriodHoursRemaining} hours`,
                    gracePeriodHoursRemaining
                )
            }
        </b>
    );
    return (
        <>
            <p>
                {
                    // translator: Full sentence is "You will be able to reset your password in XX hours."
                    c('session_recovery:sign_out:info').jt`You will be able to reset your password in ${boldTimeLeft}.`
                }
            </p>
            <p>{c('session_recovery:sign_out:info')
                .t`If you sign out before you reset your password, you could lose access to your account.`}</p>
        </>
    );
};

interface Props {
    onClose: () => void;
    onSignOut: () => void;
    open: boolean;
}

const SessionRecoverySignOutConfirmPrompt = ({ onClose, onSignOut, open }: Props) => {
    const sessionRecoveryState = useSessionRecoveryState();

    const passwordReset = (
        <SettingsLink key="password-reset-link" path="/account-password" onClick={onClose}>
            {
                // translator: Full sentence "Password reset is now available."
                c('session_recovery:sign_out:link').t`Password reset`
            }
        </SettingsLink>
    );

    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={c('session_recovery:sign_out:title').t`Sign out without password reset?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onClose();
                        onSignOut();
                    }}
                >
                    {c('session_recovery:sign_out:action').t`Sign out`}
                </Button>,
                <Button onClick={onClose}>{c('session_recovery:sign_out:action').t`Stay signed in`}</Button>,
            ]}
        >
            {sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD && <GracePeriodText />}
            {sessionRecoveryState === SessionRecoveryState.INSECURE && (
                <>
                    <p>
                        {
                            // translator: Full sentence "Password reset is now available."
                            c('session_recovery:sign_out:info').jt`${passwordReset} is now available.`
                        }
                    </p>
                    <p>
                        {c('session_recovery:sign_out:info')
                            .t`If you sign out without resetting your password, you could lose access to your account.`}
                    </p>
                </>
            )}
        </Prompt>
    );
};

export default SessionRecoverySignOutConfirmPrompt;
