import { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { SignInFormHeader } from '../SignInFormHeader';
import { TestflightBanner } from '../Testflight';
import { CancelSSOButton } from '../fields/CancelSSOButton';
import { CredentialsUsernameField } from '../fields/CredentialsUsernameField';
import { RememberCheckbox } from '../fields/RememberCheckbox';
import { SignUpPrompt } from '../fields/SignUpPrompt';
import { SubmitButton } from '../fields/SubmitButton';
import { getHelpLinks } from '../helpLinks';
import {
    selectAwaitingProvider,
    selectErrorMessage,
    selectSubmitting,
    selectUsername,
} from '../state-machine/credentialsStateMachine';
import { useRememberPreference } from '../useRememberPreference';

/**
 * The auto sign-in's first step, the username only. The server then says whether the account signs in with a password
 * (the machine moves to `autoSrp` and `AutoPasswordScreen` asks for it; back returns here) or through SSO (the machine
 * opens the provider window while this stays up with a cancel button).
 */
export const AutoScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout, paths, compactForm, isPorkbun, remember: rememberMode } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector(selectErrorMessage);
    const submitting = CredentialsContext.useSelector(selectSubmitting);
    // Starts with the machine's username, so it carries over between modes
    const initialUsername = CredentialsContext.useSelector(selectUsername);
    const [username, setUsername] = useState(initialUsername);
    const remember = useRememberPreference(rememberMode);
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
            <SignInFormHeader onBack={onBack} />
            <layout.Body>
                <form
                    name="loginForm"
                    data-testid="login-form-auto"
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
                        label={c('Label').t`Email or username`}
                        value={username}
                        onValue={setUsername}
                        error={validator([requiredValidator(username)]) || !!errorMessage}
                    />
                    <div className="mb-4">
                        <Link to={getHelpLinks(paths, username).forgotUsernamePath}>{c('Link').t`Forgot email?`}</Link>
                    </div>
                    <RememberCheckbox remember={remember} disabled={submitting} />
                    <SubmitButton submitting={submitting} compactForm={compactForm}>
                        {c('Action').t`Continue`}
                    </SubmitButton>
                    {awaitingSSOProvider && (
                        <CancelSSOButton onClick={() => actorRef.send({ type: 'externalSSO.cancelled' })} />
                    )}
                    {!compactForm && !isPorkbun && <SignUpPrompt paths={paths} className="text-center mt-6" />}
                </form>
            </layout.Body>
        </>
    );
};
