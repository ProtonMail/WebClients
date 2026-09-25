import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { CancelSSOButton } from '../fields/CancelSSOButton';
import { CredentialsUsernameField } from '../fields/CredentialsUsernameField';
import { LoginErrorBlock } from '../fields/LoginErrorBlock';
import { SubmitButton, getSignInButtonText } from '../fields/SubmitButton';
import { CredentialsStateMachineTags } from '../state-machine/credentialsStateMachine';
import { useRememberPreference } from '../useRememberPreference';

/** Sign-in through the organization's identity provider; only the email is asked here, and the provider checks it. */
export const SSOForm = () => {
    const { compactForm, remember: rememberMode, showContinueTo, toAppName } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector((snapshot) => snapshot.context.errorMessage);
    const submitting = CredentialsContext.useSelector((snapshot) =>
        snapshot.hasTag(CredentialsStateMachineTags.submitting)
    );
    // Starts with the machine's username, so it carries over between modes
    const initialUsername = CredentialsContext.useSelector((snapshot) => snapshot.context.username);
    const [username, setUsername] = useState(initialUsername);
    const remember = useRememberPreference(rememberMode);
    const signInText = showContinueTo ? `Continue to ${toAppName}` : c('Action').t`Sign in`;
    const awaitingSSOProvider = CredentialsContext.useSelector((snapshot) =>
        snapshot.hasTag(CredentialsStateMachineTags.awaitingProvider)
    );
    const { validator } = useFormErrors();

    const handleSubmit = () => {
        actorRef.send({
            type: 'credentials.usernameSubmitted',
            payload: { username, persistent: remember.persistent },
        });
    };

    return (
        <form
            name="loginForm"
            data-testid="login-form"
            method="post"
            onSubmit={(event) => {
                event.preventDefault();
                if (!submitting) {
                    handleSubmit();
                }
            }}
        >
            <CredentialsUsernameField
                label={c('Label').t`Email`}
                value={username}
                onValue={setUsername}
                error={validator([requiredValidator(username)]) || !!errorMessage}
            />
            <LoginErrorBlock message={errorMessage} />
            <SubmitButton submitting={submitting} compactForm={compactForm}>
                {getSignInButtonText(submitting, signInText)}
            </SubmitButton>
            {awaitingSSOProvider ? (
                <CancelSSOButton onClick={() => actorRef.send({ type: 'externalSSO.cancelled' })} />
            ) : (
                <div className="text-center mt-4">
                    <InlineLinkButton
                        type="button"
                        color="norm"
                        disabled={submitting}
                        onClick={() =>
                            actorRef.send({ type: 'credentials.passwordSignInRequested', payload: { username } })
                        }
                    >
                        {c('Action').t`Sign in with password`}
                    </InlineLinkButton>
                </div>
            )}
        </form>
    );
};
