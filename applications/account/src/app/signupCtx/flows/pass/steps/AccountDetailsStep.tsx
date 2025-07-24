import { type FC } from 'react';

import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';

import { useSignup } from '../../../context/SignupContext';
import { AccountDetailsForm } from '../components/forms/AccountDetailsForm';
import { Layout } from '../components/layout/Layout';
import { Step, useFlow } from '../contexts/FlowContext';
import { AccountDetailsAside } from './AccountDetailsAside';

export const AccountDetailsStep: FC = () => {
    const signup = useSignup();
    const notifyError = useNotifyErrorHandler();
    const { setStep } = useFlow();

    return (
        <Layout aside={<AccountDetailsAside />}>
            <AccountDetailsForm
                onSuccess={async () => {
                    try {
                        await signup.createUser();
                        await signup.setupUser();
                        setStep(Step.RecoveryKit);
                    } catch (error) {
                        notifyError(error);
                    }
                }}
            />
        </Layout>
    );
};
