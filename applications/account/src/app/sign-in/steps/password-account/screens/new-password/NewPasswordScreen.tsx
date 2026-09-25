import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import SetPasswordWithPolicyForm from '../../../../../components/password-forms/SetPasswordWithPolicyForm';
import Text from '../../../../../public/Text';
import { SignInStepLayout } from '../../../../components/SignInStepLayout';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectPasswordPolicies, selectSubmitting } from '../../state-machine/passwordAccountStateMachine';

export const NewPasswordScreen = () => {
    const actorRef = PasswordAccountContext.useActorRef();
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);
    const passwordPolicies = PasswordAccountContext.useSelector(selectPasswordPolicies);

    return (
        <SignInStepLayout
            title={c('Title').t`Set new password`}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            <Text>
                {c('Info')
                    .t`This will replace your temporary password. You will use it to access your ${BRAND_NAME} Account in the future.`}
            </Text>
            <SetPasswordWithPolicyForm
                passwordPolicies={passwordPolicies}
                submitting={submitting}
                onSubmit={({ password }) => actorRef.send({ type: 'newPassword.submitted', payload: { password } })}
            />
        </SignInStepLayout>
    );
};
