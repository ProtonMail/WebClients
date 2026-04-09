import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { useRequestCode } from '../../hooks/useRequestCode';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const EnterSMSRecoveryCode = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username, redactedRecoveryPhoneNumber } = snapshot.context;

    const [loading, withLoading] = useLoading();
    const errorHandler = useErrorHandler();
    const RedactedPhoneNumber = <strong key="redacted-phone-number">{redactedRecoveryPhoneNumber}</strong>;

    const requestCode = useRequestCode({
        method: 'phone',
        username,
        onSuccess: () => {
            send({
                type: 'sms.code.sent',
            });
        },
        onError: errorHandler,
    });

    const handleSubmit = () => {
        if (loading) {
            return;
        }

        void withLoading(requestCode());
    };
    return (
        <>
            <Header
                title={c('Title').t`Verify it’s you`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p>
                    {c('Info')
                        .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
                </p>

                <p>
                    {c('Info')
                        .jt`${BRAND_NAME} will send a verification code to ${RedactedPhoneNumber}. Standard message rates may apply.`}
                </p>

                <Button
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    onClick={handleSubmit}
                    loading={loading}
                    className="mt-6"
                >
                    {c('Action').t`Send code`}
                </Button>

                <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                    {c('Action').t`Try another way`}
                </Button>
            </Content>
        </>
    );
};
