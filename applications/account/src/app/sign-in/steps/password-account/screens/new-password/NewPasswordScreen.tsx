import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import SetPasswordWithPolicyForm from '../../../../../components/password-forms/SetPasswordWithPolicyForm';
import Text from '../../../../../public/Text';
import type { SignInScreen, SignInScreenProps } from '../../../../routes/signInRoute';
import { useSignInProps } from '../../../../wizard/SignInProvider';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectPasswordPolicies, selectSubmitting } from '../../state-machine/passwordAccountStateMachine';

export const NewPasswordScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = PasswordAccountContext.useActorRef();
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);
    const passwordPolicies = PasswordAccountContext.useSelector(selectPasswordPolicies);

    return (
        <>
            <layout.Header title={c('Title').t`Set new password`} onBack={onBack} />
            <layout.Body>
                <Text>
                    {c('Info')
                        .t`This will replace your temporary password. You will use it to access your ${BRAND_NAME} Account in the future.`}
                </Text>
                <SetPasswordWithPolicyForm
                    passwordPolicies={passwordPolicies}
                    submitting={submitting}
                    onSubmit={({ password }) => actorRef.send({ type: 'newPassword.submitted', payload: { password } })}
                />
            </layout.Body>
        </>
    );
};
