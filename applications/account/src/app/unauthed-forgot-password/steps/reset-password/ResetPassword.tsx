import { c } from 'ttag';

import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLocalState from '@proton/components/hooks/useLocalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import SetPasswordWithPolicyForm from '../../../login/SetPasswordWithPolicyForm';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { defaultPersistentKey } from '../../../public/helper';
import { useGetAccountKTActivation } from '../../../useGetAccountKTActivation';
import { performPasswordChangeViaMnemonic, performPasswordReset } from '../../actions';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useForgotPasswordProps } from '../../wizard/ForgotPasswordProvider';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const ResetPassword = () => {
    const { onLogin, productParam, setupVPN } = useForgotPasswordProps();
    const { snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username, resetResponse, ownershipVerificationCode, mnemonicData, resetWithDataLoss } = snapshot.context;
    const { createNotification } = useNotifications();

    const silentApi = useSilentApi();
    const [persistent] = useLocalState(false, defaultPersistentKey);
    const getKtActivation = useGetAccountKTActivation();
    const errorHandler = useErrorHandler();

    const handleSubmit = async (newPassword: string) => {
        createNotification({
            text: c('Info').t`This can take a few seconds or a few minutes depending on your device`,
            type: 'info',
        });

        try {
            if (mnemonicData) {
                const authSession = await performPasswordChangeViaMnemonic({
                    newPassword,
                    mnemonicData: { ...mnemonicData, api: silentApi },
                    persistent,
                    api: silentApi,
                });
                await onLogin(authSession);
            } else if (resetResponse) {
                const authSession = await performPasswordReset({
                    newPassword,
                    username,
                    ownershipVerificationCode,
                    resetResponse,
                    persistent,
                    productParam,
                    ktActivation: await getKtActivation(),
                    setupVPN,
                    api: silentApi,
                });
                await onLogin(authSession);
            }
        } catch (error) {
            errorHandler(error);
        }
    };

    return (
        <>
            <Header title={c('Title').t`Reset password?`} subTitle={<UserNameWithIcon username={username} />} />
            <Content>
                <SetPasswordWithPolicyForm
                    passwordPolicies={resetResponse?.PasswordPolicies ?? []}
                    onSubmit={async ({ password }) => {
                        await handleSubmit(password);
                    }}
                    submitButtonColor={resetWithDataLoss ? 'danger' : 'norm'}
                />
            </Content>
        </>
    );
};
