import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Prompt, useSessionRecoveryGracePeriodHoursRemaining } from '@proton/components';
import { SettingsLink } from '@proton/components/components';

const SessionRecoveryResetConfirmedPrompt = ({ open, onClose }: { open?: boolean; onClose?: () => void }) => {
    const gracePeriodHoursRemaining = useSessionRecoveryGracePeriodHoursRemaining();

    if (gracePeriodHoursRemaining === null) {
        return null;
    }

    const accountAndPasswordSectionLink = (
        <SettingsLink key="account-and-password-section-link" path="/account-password" onClick={onClose}>{
            // translator: full sentence "You can check the status of your request at any time in the account and password section of the settings."
            c('session_recovery:initiation:link').t`account and password section`
        }</SettingsLink>
    );

    return (
        <Prompt
            title={c('session_recovery:initiation:title').ngettext(
                msgid`You'll be able to reset your password in ${gracePeriodHoursRemaining} hour`,
                `You'll be able to reset your password in ${gracePeriodHoursRemaining} hours`,
                gracePeriodHoursRemaining
            )}
            open={open}
            buttons={[
                <ButtonLike as={SettingsLink} path="/account-password" onClick={onClose}>
                    {c('session_recovery:initiation:action').t`Got it`}
                </ButtonLike>,
            ]}
        >
            <p>{c('session_recovery:initiation:info')
                .t`We will contact you again when the password reset is available.`}</p>
            <p>
                {
                    // translator: full sentence "You can check the status of your request at any time in the account and password section of the settings."
                    c('session_recovery:initiation:info')
                        .jt`You can check the status of your request at any time in the ${accountAndPasswordSectionLink} of the settings.`
                }
            </p>
        </Prompt>
    );
};

export default SessionRecoveryResetConfirmedPrompt;
