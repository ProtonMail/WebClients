import { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { UserNameButton } from '../../../../components/username/UserNameButton';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { useLoginChallengeContext } from '../LoginChallengeContext';
import { TestflightBanner } from '../Testflight';
import { getSignInText } from '../continueTo';
import { LoginErrorBlock } from '../fields/LoginErrorBlock';
import { PasswordField } from '../fields/PasswordField';
import { SubmitButton, getSignInButtonText } from '../fields/SubmitButton';
import { getHelpLinks } from '../helpLinks';
import {
    selectCanGoBack,
    selectErrorMessage,
    selectSubmitting,
    selectUsername,
} from '../state-machine/credentialsStateMachine';
import { useRememberPreference } from '../useRememberPreference';

/** The auto sign-in's second step: the password for the username `AutoScreen` checked. */
export const AutoPasswordScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout, paths, compactForm, remember: rememberMode, showContinueTo, toAppName } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector(selectErrorMessage);
    const { getPayload } = useLoginChallengeContext();
    // Covers the wait for the challenge result, before the machine takes over
    const [collecting, withCollecting] = useLoading();
    const submitting = CredentialsContext.useSelector(selectSubmitting) || collecting;
    // Submitted in the username step
    const username = CredentialsContext.useSelector(selectUsername);
    // Back to the username works until the password is accepted; after that the sign-in may leave the page
    const canGoBack = CredentialsContext.useSelector(selectCanGoBack);
    const remember = useRememberPreference(rememberMode);
    const signInText = getSignInText({ showContinueTo, toAppName });
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
        <>
            {/* The account is known by now: it's greeted and named, the testflight variant too */}
            <layout.Header
                title={c('sso').t`Welcome`}
                subTitle={<UserNameButton username={username} onClick={onBack} disabled={!canGoBack} />}
                onBack={onBack}
            />
            <layout.Body>
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
                    <TestflightBanner />
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
            </layout.Body>
        </>
    );
};

// Back goes to the username. Once the password is accepted it's ignored (the sign-in may be leaving the page), but the
// arrow stays so the layout doesn't jump; the username button shows it disabled
AutoPasswordScreen.offersBack = true;
