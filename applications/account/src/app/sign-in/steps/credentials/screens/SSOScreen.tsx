import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { TestflightBanner, useTestflightSubTitle, useTestflightTitle } from '../Testflight';
import { getContinueTo, getSignInText } from '../continueTo';
import { CancelSSOButton } from '../fields/CancelSSOButton';
import { CredentialsUsernameField } from '../fields/CredentialsUsernameField';
import { LoginErrorBlock } from '../fields/LoginErrorBlock';
import { SubmitButton, getSignInButtonText } from '../fields/SubmitButton';
import {
    selectAwaitingProvider,
    selectErrorMessage,
    selectSubmitting,
    selectUsername,
} from '../state-machine/credentialsStateMachine';
import { useRememberPreference } from '../useRememberPreference';

/** Sign-in through the organization's identity provider; only the email is asked here, and the provider checks it. */

export const SSOScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const signInProps = useSignInProps();
    const { layout, compactForm, remember: rememberMode, showContinueTo, toAppName } = signInProps;
    // The testflight variant's title and subtitle show instead; otherwise the subtitle is the app it continues to, if any
    const title = useTestflightTitle() ?? c('sso').t`Sign in to your organization`;
    const subTitle = useTestflightSubTitle() ?? (getContinueTo(signInProps) || undefined);
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector(selectErrorMessage);
    const submitting = CredentialsContext.useSelector(selectSubmitting);
    // Starts with the machine's username, so it carries over between modes
    const initialUsername = CredentialsContext.useSelector(selectUsername);
    const [username, setUsername] = useState(initialUsername);
    const remember = useRememberPreference(rememberMode);
    const signInText = getSignInText({ showContinueTo, toAppName });
    const awaitingSSOProvider = CredentialsContext.useSelector(selectAwaitingProvider);
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = () => {
        actorRef.send({
            type: 'credentials.usernameSubmitted',
            payload: { username, persistent: remember.persistent },
        });
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
                            handleSubmit();
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
                                onClick={() =>
                                    actorRef.send({
                                        type: 'credentials.passwordSignInRequested',
                                        payload: { username },
                                    })
                                }
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
