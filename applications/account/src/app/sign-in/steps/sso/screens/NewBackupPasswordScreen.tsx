import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import SetPasswordWithPolicyForm from '../../../../components/password-forms/SetPasswordWithPolicyForm';
import Text from '../../../../public/Text';
import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import SSODeviceAccessGranted from '../components/SSODeviceAccessGranted';
import {
    selectBackupPasswordDisabled,
    selectJoinOrganization,
    selectSubmitting,
} from '../state-machine/ssoStateMachine';

/** After an admin approval: a new backup password, or just a confirmation when the organization disabled it. */
export const NewBackupPasswordScreen = () => {
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    const passwordPolicies = SSOContext.useSelector((snapshot) => selectJoinOrganization(snapshot).passwordPolicies);
    const backupPasswordDisabled = SSOContext.useSelector(selectBackupPasswordDisabled);
    const onBack = () => actorRef.send({ type: 'decision.back' });

    if (backupPasswordDisabled) {
        return (
            <SignInStepLayout title="" onBack={onBack}>
                <SSODeviceAccessGranted
                    submitting={submitting}
                    onContinue={() =>
                        actorRef.send({ type: 'sso.newBackupPassword.submitted', payload: { password: null } })
                    }
                />
            </SignInStepLayout>
        );
    }

    return (
        <SignInStepLayout title={c('sso').t`Set your backup password`} onBack={onBack}>
            <Text margin="small">
                {c('sso')
                    .t`If you get locked out of your ${BRAND_NAME} Account, your backup password will allow you to sign in and recover your data.`}
            </Text>
            <Text>
                {c('sso').t`It’s the only way to fully restore your account, so make sure to keep it somewhere safe.`}
            </Text>
            <SetPasswordWithPolicyForm
                passwordPolicies={passwordPolicies}
                submitting={submitting}
                onSubmit={({ password }) =>
                    actorRef.send({ type: 'sso.newBackupPassword.submitted', payload: { password } })
                }
                type="backup"
            />
        </SignInStepLayout>
    );
};
