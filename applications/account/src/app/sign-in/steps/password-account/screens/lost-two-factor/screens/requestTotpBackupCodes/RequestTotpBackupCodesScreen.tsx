import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { TotpRecoveryCodeInputField } from '@proton/components/containers/account/totp/TotpInputs';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAStepLayout } from '../../Lost2FAStepLayout';
import { Lost2FAStateMachineTags } from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';

const RequestCodes = () => {
    const { send } = Lost2FAContext.useActorRef();
    const [code, setCode] = useState('');
    const error = Lost2FAContext.useSelector((s) => s.context.backupCodeError) || '';
    // Also while a valid code signs in: the form stays up, loading, until the sign-in completes
    const loading = Lost2FAContext.useSelector((s) => s.hasTag(Lost2FAStateMachineTags.submitting));

    const { validator, onFormSubmit } = useFormErrors();

    const safeCode = code.replaceAll(/\s+/g, '');
    const requiredError = requiredValidator(safeCode);

    return (
        <form
            name="totpForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                send({ type: 'lost2FA.backupCode.submitted', code: safeCode });
            }}
            method="post"
        >
            <TotpRecoveryCodeInputField
                code={code}
                error={validator([requiredError]) || error}
                loading={loading}
                setCode={(value: string) => {
                    setCode(value);
                    send({ type: 'lost2FA.backupCode.edited' });
                }}
                bigger
            />

            <Button size="large" fullWidth color="norm" type="submit" loading={loading} className="mb-2 mt-4">
                {c('Action').t`Authenticate`}
            </Button>
            <Button size="large" fullWidth onClick={() => send({ type: 'lost2FA.otherMethodRequested' })}>
                {c('Action').t`I don’t have my backup codes`}
            </Button>
        </form>
    );
};

export const RequestTotpBackupCodesScreen = () => {
    const requestBackupCode = Lost2FAContext.useSelector((s) => s.matches({ requestBackupCode: 'idle' }));

    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        if (!requestBackupCode) {
            return;
        }

        sendStepLoad('request totp backup codes');
    }, [requestBackupCode]);

    return (
        <Lost2FAStepLayout title={c('Title').t`Use backup recovery code`}>
            <RequestCodes />
        </Lost2FAStepLayout>
    );
};
