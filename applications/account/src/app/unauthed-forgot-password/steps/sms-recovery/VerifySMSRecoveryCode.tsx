import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { InputFieldTwo } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import type { ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { validateResetToken } from '@proton/shared/lib/api/reset';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import { getSMSVerificationCodeText } from '../../../content/helper';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { getDeviceRecoveryLevel } from '../../actions';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const VerifySMSRecoveryCode = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username, redactedRecoveryPhoneNumber } = snapshot.context;

    const silentApi = useSilentApi();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const [code, setCode] = useState('');
    const errorHandler = useErrorHandler();
    const RedactedPhoneNumber = <strong key="redacted-phone-number">{redactedRecoveryPhoneNumber}</strong>;

    const handleSubmit = async () => {
        try {
            const resetResponse = await silentApi<ValidateResetTokenResponse>(validateResetToken(username, code));
            const deviceRecoveryLevel = await getDeviceRecoveryLevel(resetResponse);

            send({
                type: 'sms.code.validated',
                payload: {
                    ownershipVerificationCode: code,
                    resetResponse,
                    deviceRecoveryLevel,
                },
            });
        } catch (error) {
            errorHandler(error);
        }
    };
    return (
        <>
            <Header
                title={c('Title').t`Verify it’s you`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p>{getSMSVerificationCodeText(RedactedPhoneNumber)}</p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (loading || !onFormSubmit()) {
                            return;
                        }

                        void withLoading(handleSubmit());
                    }}
                >
                    <InputFieldTwo
                        id="reset-token"
                        bigger
                        label={c('Label').t`Enter code`}
                        error={validator([requiredValidator(code)])}
                        disableChange={loading}
                        value={code}
                        onValue={setCode}
                        autoFocus
                    />
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                        {c('Action').t`Verify`}
                    </Button>

                    <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                        {c('Action').t`Try another way`}
                    </Button>
                </form>
            </Content>
        </>
    );
};
