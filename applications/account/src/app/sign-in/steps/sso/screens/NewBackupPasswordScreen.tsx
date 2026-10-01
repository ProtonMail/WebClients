import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import SetPasswordWithPolicyForm from '../../../../components/password-forms/SetPasswordWithPolicyForm';
import Text from '../../../../public/Text';
import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import { selectJoinOrganization, selectSubmitting } from '../state-machine/ssoStateMachine';

/** After an admin approval: a new backup password (`AccessGrantedScreen` when the organization disabled them). */
export const NewBackupPasswordScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    const passwordPolicies = SSOContext.useSelector((snapshot) => selectJoinOrganization(snapshot).passwordPolicies);

    return (
        <>
            <layout.Header title={c('sso').t`Set your backup password`} onBack={onBack} />
            <layout.Body>
                <Text margin="small">
                    {c('sso')
                        .t`If you get locked out of your ${BRAND_NAME} Account, your backup password will allow you to sign in and recover your data.`}
                </Text>
                <Text>
                    {c('sso')
                        .t`It’s the only way to fully restore your account, so make sure to keep it somewhere safe.`}
                </Text>
                <SetPasswordWithPolicyForm
                    passwordPolicies={passwordPolicies}
                    submitting={submitting}
                    onSubmit={({ password }) =>
                        actorRef.send({ type: 'sso.newBackupPassword.submitted', payload: { password } })
                    }
                    type="backup"
                />
            </layout.Body>
        </>
    );
};
