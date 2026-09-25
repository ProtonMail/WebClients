import { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { useLoginChallengeContext } from '../LoginChallengeContext';
import { CancelSSOButton } from '../fields/CancelSSOButton';
import { CredentialsUsernameField } from '../fields/CredentialsUsernameField';
import { LoginErrorBlock } from '../fields/LoginErrorBlock';
import { PasswordField } from '../fields/PasswordField';
import { RememberCheckbox } from '../fields/RememberCheckbox';
import { SignUpPrompt } from '../fields/SignUpPrompt';
import { SubmitButton, getSignInButtonText } from '../fields/SubmitButton';
import { getHelpLinks } from '../helpLinks';
import { CredentialsStateMachineTags } from '../state-machine/credentialsStateMachine';
import { useRememberPreference } from '../useRememberPreference';

/*
 * The auto sign-in: two steps of one flow. `AutoForm` asks for the username; the server then says whether the account
 * signs in with a password (the machine moves to `autoSrp` and `AutoPasswordForm` asks for it, back returns here) or
 * through SSO (the machine opens the provider window while `AutoForm` stays up with a cancel button).
 */

/** Username only; the machine then asks for the password or opens the SSO provider. */
export const AutoForm = () => {
    const { paths, compactForm, isPorkbun, remember: rememberMode } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector((snapshot) => snapshot.context.errorMessage);
    const submitting = CredentialsContext.useSelector((snapshot) =>
        snapshot.hasTag(CredentialsStateMachineTags.submitting)
    );
    // Starts with the machine's username, so it carries over between modes
    const initialUsername = CredentialsContext.useSelector((snapshot) => snapshot.context.username);
    const [username, setUsername] = useState(initialUsername);
    const remember = useRememberPreference(rememberMode);
    const awaitingSSOProvider = CredentialsContext.useSelector((snapshot) =>
        snapshot.hasTag(CredentialsStateMachineTags.awaitingProvider)
    );
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = () => {
        actorRef.send({
            type: 'credentials.usernameSubmitted',
            payload: { username, persistent: remember.persistent },
        });
    };

    return (
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
    );
};

/** The password for the username checked in the auto mode. */
export const AutoPasswordForm = () => {
    const { paths, compactForm, remember: rememberMode, showContinueTo, toAppName } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector((snapshot) => snapshot.context.errorMessage);
    const { getPayload } = useLoginChallengeContext();
    // Covers the wait for the challenge result, before the machine takes over
    const [collecting, withCollecting] = useLoading();
    const submitting =
        CredentialsContext.useSelector((snapshot) => snapshot.hasTag(CredentialsStateMachineTags.submitting)) ||
        collecting;
    // Submitted in the username step
    const username = CredentialsContext.useSelector((snapshot) => snapshot.context.username);
    const remember = useRememberPreference(rememberMode);
    const signInText = showContinueTo ? `Continue to ${toAppName}` : c('Action').t`Sign in`;
    const links = getHelpLinks(paths, username);
    const [password, setPassword] = useState('');
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        const payload = await getPayload();
        actorRef.send({
            type: 'credentials.submitted',
            payload: { username, password, persistent: remember.persistent, payload },
        });
    };

    return (
        <form
            name="loginForm"
            data-testid="login-form-auto"
            method="post"
            onSubmit={(event) => {
                event.preventDefault();
                if (!submitting && onFormSubmit()) {
                    void withCollecting(handleSubmit());
                }
            }}
        >
            <input id="username" readOnly value={username} hidden />
            <PasswordField
                label={c('Label').t`Enter your password`}
                value={password}
                onValue={setPassword}
                error={validator([requiredValidator(password)]) || !!errorMessage}
                disabled={submitting}
                autoFocus
                onChange={() => {
                    actorRef.send({ type: 'credentials.edited' });
                }}
            />
            <div className="mb-4">
                <Link
                    to={
                        // Checking the path here because VPN doesn't support the sign in with another device functionality
                        paths.signinHelp ? links.signinHelpPath : links.resetPath
                    }
                >
                    {c('Link').t`Forgot password?`}
                </Link>
            </div>
            {errorMessage && (
                <div className="mt-4">
                    <LoginErrorBlock message={errorMessage} />
                </div>
            )}
            <SubmitButton submitting={submitting} compactForm={compactForm}>
                {getSignInButtonText(submitting, signInText)}
            </SubmitButton>
        </form>
    );
};
