import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { useLoginChallengeContext } from '../LoginChallengeContext';
import { TestflightBanner, useTestflightSubTitle, useTestflightTitle } from '../Testflight';
import { getContinueTo, getSignInText } from '../continueTo';
import { CancelSSOButton } from '../fields/CancelSSOButton';
import { CredentialsUsernameField } from '../fields/CredentialsUsernameField';
import { LoginErrorBlock } from '../fields/LoginErrorBlock';
import { SubmitButton, getSignInButtonText } from '../fields/SubmitButton';
import {
    selectAwaitingProvider,
    selectErrorMessage,
    selectPersistent,
    selectSubmitting,
    selectUsername,
} from '../state-machine/credentialsStateMachine';

/** Sign-in through the organization's identity provider; only the email is asked here, and the provider checks it. */

export const SSOScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const signInProps = useSignInProps();
    const { layout, compactForm, showContinueTo, toAppName } = signInProps;
    // The testflight variant's title and subtitle show instead; otherwise the subtitle is the app it continues to, if any
    const title = useTestflightTitle() ?? c('sso').t`Sign in to your organization`;
    const subTitle = useTestflightSubTitle() ?? (getContinueTo(signInProps) || undefined);
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector(selectErrorMessage);
    const { getPayload } = useLoginChallengeContext();
    // Covers the wait for the challenge result, before the machine takes over
    const [collecting, withCollecting] = useLoading();
    const submitting = CredentialsContext.useSelector(selectSubmitting) || collecting;
    // Starts with the machine's username, so it carries over between modes
    const initialUsername = CredentialsContext.useSelector(selectUsername);
    const [username, setUsername] = useState(initialUsername);
    // No checkbox here: the choice the last form submitted, or on
    const persistent = CredentialsContext.useSelector(selectPersistent);
    const signInText = getSignInText({ showContinueTo, toAppName });
    const awaitingSSOProvider = CredentialsContext.useSelector(selectAwaitingProvider);
    const { validator, onFormSubmit } = useFormErrors();

    // Waiting for the challenge result is intentional: the auth info request is going to need it too, and the password
    // step may follow (password sign-in, or the server switching to it) and sends it
    const handleSubmit = async () => {
        const payload = await getPayload();
        actorRef.send({
            type: 'credentials.usernameSubmitted',
            payload: { username, persistent, payload },
        });
    };

    const handlePasswordSignIn = async () => {
        const payload = await getPayload();
        actorRef.send({ type: 'credentials.passwordSignInRequested', payload: { username, payload } });
    };

    return (
        <>
            <layout.Header title={title} subTitle={subTitle} onBack={onBack} />
            <layout.Body>
                <form
                    name="loginForm"
                    data-testid="login-form"
                    method="post"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!submitting && onFormSubmit()) {
                            void withCollecting(handleSubmit());
                        }
                    }}
                >
                    <TestflightBanner />
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
                                onClick={() => {
                                    // The password step only asks for the password, so the email comes first
                                    if (onFormSubmit()) {
                                        void withCollecting(handlePasswordSignIn());
                                    }
                                }}
                            >
                                {c('Action').t`Sign in with password`}
                            </InlineLinkButton>
                        </div>
                    )}
                </form>
            </layout.Body>
        </>
    );
};
