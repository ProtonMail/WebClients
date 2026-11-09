import { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { LoginErrorBlock } from '../../../../components/LoginErrorBlock';
import { getSessionExpiredMessage } from '../../../../helper';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { useLoginChallengeContext } from '../LoginChallengeContext';
import { SignInFormHeader } from '../SignInFormHeader';
import { TestflightBanner } from '../Testflight';
import { CancelSSOButton } from '../fields/CancelSSOButton';
import { CredentialsUsernameField } from '../fields/CredentialsUsernameField';
import { SignUpPrompt } from '../fields/SignUpPrompt';
import { StaySignedInCheckbox, useStaySignedIn } from '../fields/StaySignedInCheckbox';
import { SubmitButton } from '../fields/SubmitButton';
import { TroubleSigningInDropdown } from '../fields/TroubleSigningInDropdown';
import { getHelpLinks } from '../helpLinks';
import {
    selectAwaitingProvider,
    selectErrorMessage,
    selectPersistent,
    selectSessionExpired,
    selectSubmitting,
    selectUsername,
} from '../state-machine/credentialsStateMachine';

/**
 * The auto sign-in's first step, the username only. The server then says whether the account signs in with a password
 * (the machine moves to `autoSrp` and `AutoPasswordScreen` asks for it; back returns here) or through SSO (the machine
 * opens the provider window while this stays up with a cancel button).
 */
export const AutoScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const {
        layout,
        paths,
        compactForm,
        isPorkbun,
        showRememberCheckbox,
        showSignUpPrompt = true,
        usernameReadOnly,
    } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector(selectErrorMessage);
    const sessionExpired = CredentialsContext.useSelector(selectSessionExpired);
    const { getPayload } = useLoginChallengeContext();
    // Covers the wait for the challenge result, before the machine takes over
    const [collecting, withCollecting] = useLoading();
    const submitting = CredentialsContext.useSelector(selectSubmitting) || collecting;
    // Starts with the machine's username, so it carries over between modes
    const initialUsername = CredentialsContext.useSelector(selectUsername);

    const [username, setUsername] = useState(initialUsername);
    const awaitingSSOProvider = CredentialsContext.useSelector(selectAwaitingProvider);
    const { validator, onFormSubmit } = useFormErrors();

    const initialPersistentValue = CredentialsContext.useSelector(selectPersistent);
    const staySignedIn = useStaySignedIn(initialPersistentValue);

    const handleSubmit = async () => {
        // Waiting is intentional: the auth info request is going to need the challenge result too
        const payload = await getPayload();
        actorRef.send({
            type: 'credentials.usernameSubmitted',
            payload: { username, persistent: staySignedIn.persistent, payload },
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
                            void withCollecting(handleSubmit());
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
                        {!usernameReadOnly && (
                            <Link to={getHelpLinks(paths, username).forgotUsernamePath}>
                                {c('Link').t`Forgot email?`}
                            </Link>
                        )}
                    </div>
                    {sessionExpired && (
                        <div className="mt-4">
                            <LoginErrorBlock message={getSessionExpiredMessage()} />
                        </div>
                    )}
                    {showRememberCheckbox && <StaySignedInCheckbox staySignedIn={staySignedIn} disabled={submitting} />}
                    <SubmitButton submitting={submitting} compactForm={compactForm}>
                        {c('Action').t`Continue`}
                    </SubmitButton>
                    {awaitingSSOProvider && (
                        <CancelSSOButton onClick={() => actorRef.send({ type: 'externalSSO.cancelled' })} />
                    )}
                    {!compactForm && !isPorkbun && showSignUpPrompt && (
                        <SignUpPrompt paths={paths} className="text-center mt-6" />
                    )}
                    {!compactForm && <TroubleSigningInDropdown paths={paths} {...getHelpLinks(paths, username)} />}
                </form>
            </layout.Body>
        </>
    );
};
