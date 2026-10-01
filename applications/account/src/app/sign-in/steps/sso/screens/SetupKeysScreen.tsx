import { shallowEqual } from '@xstate/react';

import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import SetBackupPasswordForm from '../components/SetBackupPasswordForm';
import SetupWithoutBackupPasswordForm from '../components/SetupWithoutBackupPasswordForm';
import {
    selectBackupPasswordDisabled,
    selectJoinOrganization,
    selectSubmitting,
} from '../state-machine/ssoStateMachine';

/** First SSO sign-in: sets up the member's keys, with a backup password unless the organization disabled it. */
export const SetupKeysScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    const organization = SSOContext.useSelector(selectJoinOrganization, shallowEqual);
    const backupPasswordDisabled = SSOContext.useSelector(selectBackupPasswordDisabled);
    return (
        <>
            {/* No title: each form brings its own */}
            <layout.Header onBack={onBack} />
            <layout.Body>
                {backupPasswordDisabled ? (
                    <SetupWithoutBackupPasswordForm
                        submitting={submitting}
                        organization={organization}
                        onSubmit={() => actorRef.send({ type: 'sso.setup.submitted', payload: { password: null } })}
                    />
                ) : (
                    <SetBackupPasswordForm
                        submitting={submitting}
                        organization={organization}
                        onSubmit={({ password }) =>
                            actorRef.send({ type: 'sso.setup.submitted', payload: { password } })
                        }
                    />
                )}
            </layout.Body>
        </>
    );
};
