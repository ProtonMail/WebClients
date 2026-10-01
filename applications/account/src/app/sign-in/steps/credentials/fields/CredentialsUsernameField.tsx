import type { ReactNode } from 'react';

import { useSignInProps } from '../../../wizard/SignInProvider';
import { CredentialsContext } from '../CredentialsContext';
import { useLoginChallengeContext } from '../LoginChallengeContext';
import { selectSubmitting } from '../state-machine/credentialsStateMachine';
import { UsernameField } from './UsernameField';

/** The username field of the credentials forms, observed by the anti-abuse challenge. */
export const CredentialsUsernameField = ({
    label,
    value,
    onValue,
    error,
}: {
    label: string;
    value: string;
    onValue: (value: string) => void;
    error: ReactNode | boolean;
}) => {
    const { usernameRef } = useLoginChallengeContext();
    const actorRef = CredentialsContext.useActorRef();
    const submitting = CredentialsContext.useSelector(selectSubmitting);
    // Porkbun sign-ins come with the email already set
    const { isPorkbun } = useSignInProps();
    return (
        <UsernameField
            label={label}
            value={value}
            onValue={onValue}
            error={error}
            disabled={submitting}
            readOnly={isPorkbun}
            inputRef={usernameRef}
            onChange={() => {
                // Clears the inline error once the user changes the field
                actorRef.send({ type: 'credentials.edited' });
            }}
        />
    );
};
