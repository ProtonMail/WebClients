import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Prompt, SettingsLink } from '@proton/components/components';
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
                c('Info').ngettext(
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
                    c('Info').jt`You will be able to reset your password in ${boldTimeLeft}.`
                }
            </p>
            <p>{c('Info').t`If you sign out before you reset your password, you could lose access to your account.`}</p>
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
                c('Link').t`Password reset`
            }
        </SettingsLink>
    );

    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={c('Title').t`Sign out without password reset?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onClose();
                        onSignOut();
                    }}
                >
                    {c('Action').t`Sign out`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Stay signed in`}</Button>,
            ]}
        >
            {sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD && <GracePeriodText />}
            {sessionRecoveryState === SessionRecoveryState.INSECURE && (
                <>
                    <p>
                        {
                            // translator: Full sentence "Password reset is now available."
                            c('Info').jt`${passwordReset} is now available.`
                        }
                    </p>
                    <p>
                        {c('Info')
                            .t`If you sign out without resetting your password, you could lose access to your account.`}
                    </p>
                </>
            )}
        </Prompt>
    );
};

export default SessionRecoverySignOutConfirmPrompt;
