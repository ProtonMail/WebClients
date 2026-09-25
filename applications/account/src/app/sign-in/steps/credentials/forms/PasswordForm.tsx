import { useState } from 'react';

import { c } from 'ttag';

import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { useLoginChallengeContext } from '../LoginChallengeContext';
import { CredentialsUsernameField } from '../fields/CredentialsUsernameField';
import { LoginErrorBlock } from '../fields/LoginErrorBlock';
import { PasswordField } from '../fields/PasswordField';
import { RememberCheckbox } from '../fields/RememberCheckbox';
import { SignUpPrompt } from '../fields/SignUpPrompt';
import { SubmitButton, getSignInButtonText } from '../fields/SubmitButton';
import { TroubleSigningInDropdown } from '../fields/TroubleSigningInDropdown';
import { getHelpLinks } from '../helpLinks';
import { CredentialsStateMachineTags } from '../state-machine/credentialsStateMachine';
import { useRememberPreference } from '../useRememberPreference';

export const PasswordForm = () => {
    const { paths, compactForm, isPorkbun, remember: rememberMode, showContinueTo, toAppName } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const errorMessage = CredentialsContext.useSelector((snapshot) => snapshot.context.errorMessage);
    const { getPayload } = useLoginChallengeContext();
    // Covers the wait for the challenge result, before the machine takes over
    const [collecting, withCollecting] = useLoading();
    const submitting =
        CredentialsContext.useSelector((snapshot) => snapshot.hasTag(CredentialsStateMachineTags.submitting)) ||
        collecting;
    // Starts with the machine's username, so it carries over between modes
    const initialUsername = CredentialsContext.useSelector((snapshot) => snapshot.context.username);
    const [username, setUsername] = useState(initialUsername);
    const [password, setPassword] = useState('');
    const remember = useRememberPreference(rememberMode);
    const signInText = showContinueTo ? `Continue to ${toAppName}` : c('Action').t`Sign in`;
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
            data-testid="login-form"
            method="post"
            onSubmit={(event) => {
                event.preventDefault();
                if (!submitting && onFormSubmit()) {
                    void withCollecting(handleSubmit());
                }
            }}
        >
            <CredentialsUsernameField
                label={c('Label').t`Email or username`}
                value={username}
                onValue={setUsername}
                error={validator([requiredValidator(username)]) || !!errorMessage}
            />
            <PasswordField
                label={c('Label').t`Password`}
                value={password}
                onValue={setPassword}
                error={validator([requiredValidator(password)]) || !!errorMessage}
                disabled={submitting}
                onChange={() => {
                    actorRef.send({ type: 'credentials.edited' });
                }}
            />
            <LoginErrorBlock message={errorMessage} />
            <RememberCheckbox remember={remember} disabled={submitting} />
            <SubmitButton submitting={submitting} compactForm={compactForm}>
                {getSignInButtonText(submitting, signInText)}
            </SubmitButton>
            {!compactForm && !isPorkbun && <SignUpPrompt paths={paths} className="text-center mt-4" />}
            {!compactForm && <TroubleSigningInDropdown paths={paths} {...getHelpLinks(paths, username)} />}
        </form>
    );
};
