import { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { LoginErrorBlock } from '../../../../components/LoginErrorBlock';
import { UserNameButton } from '../../../../components/username/UserNameButton';
import { getSessionExpiredMessage } from '../../../../helper';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { TestflightBanner } from '../Testflight';
import { getSignInText } from '../continueTo';
import { PasswordField } from '../fields/PasswordField';
import { SubmitButton, getSignInButtonText } from '../fields/SubmitButton';
import { getHelpLinks } from '../helpLinks';
import {
    selectCanGoBack,
    selectErrorMessage,
    selectPersistent,
    selectSessionExpired,
    selectSubmitting,
    selectUsername,
} from '../state-machine/credentialsStateMachine';

/** The auto sign-in's second step: the password for the username `AutoScreen` checked. */
export const AutoPasswordScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout, paths, compactForm, showContinueTo, toAppName } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector(selectErrorMessage);
    const sessionExpired = CredentialsContext.useSelector(selectSessionExpired);
    // Shown the same way, but the password isn't wrong
    const blockMessage = errorMessage || (sessionExpired ? getSessionExpiredMessage() : undefined);
    const submitting = CredentialsContext.useSelector(selectSubmitting);
    // Submitted in the username step
    const username = CredentialsContext.useSelector(selectUsername);
    // Back to the username works until the password is accepted; after that the sign-in may leave the page
    const canGoBack = CredentialsContext.useSelector(selectCanGoBack);
    // No checkbox here: the choice the last form submitted, or on
    const persistent = CredentialsContext.useSelector(selectPersistent);
    const signInText = getSignInText({ showContinueTo, toAppName });
    const links = getHelpLinks(paths, username);
    const [password, setPassword] = useState('');
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = () => {
        actorRef.send({
            type: 'credentials.submitted',
            payload: { username, password, persistent },
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
                            handleSubmit();
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
                    {blockMessage && (
                        <div className="mt-4">
                            <LoginErrorBlock message={blockMessage} />
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
