import type { ComponentType } from 'react';

import { AuthType } from '../../auth/interface';
import { CredentialsContext } from './CredentialsContext';
import { LoginChallengeProvider } from './LoginChallengeContext';
import { AutoForm, AutoPasswordForm } from './forms/AutoForms';
import { PasswordForm } from './forms/PasswordForm';
import { SSOForm } from './forms/SSOForm';
import { selectAuthType } from './state-machine/credentialsStateMachine';
import { useLoginChallenge } from './useLoginChallenge';

const formsByAuthType: Record<AuthType, ComponentType> = {
    [AuthType.Auto]: AutoForm,
    [AuthType.AutoSrp]: AutoPasswordForm,
    [AuthType.Srp]: PasswordForm,
    [AuthType.ExternalSSO]: SSOForm,
};

/**
 * The credentials form for the current mode. Each form owns its fields and validation, so switching modes starts
 * fresh; the machine carries the username over. The anti-abuse challenge lives here, above the forms, and keeps its data;
 * each form takes its result on submit and sends it with the credentials.
 */
const LoginForm = () => {
    const authType = CredentialsContext.useSelector(selectAuthType);
    const challenge = useLoginChallenge();
    const Form = formsByAuthType[authType];

    return (
        <LoginChallengeProvider usernameRef={challenge.usernameRef} getPayload={challenge.getPayload}>
            {challenge.element}
            <Form />
        </LoginChallengeProvider>
    );
};

export default LoginForm;
