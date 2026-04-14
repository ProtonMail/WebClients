import { useEffect, useState } from 'react';

import { useSelector } from '@xstate/react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { TotpRecoveryCodeInputField } from '@proton/components/containers/account/totp/TotpInputs';
import { useFormErrors } from '@proton/components/index';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useTotpBackupCodesActorRef } from '../../UnauthedLost2FAContainer';
import type { TotpBackupCodesActorRef } from '../../state-machine/totpBackupCodeMachine';
import { useUnauthedLost2FATelemetry } from '../../useUnauthedLost2FATelemetry';

const RequestCodes = ({ actorRef }: { actorRef: TotpBackupCodesActorRef }) => {
    const { send } = actorRef;
    const [code, setCode] = useState('');
    const error = useSelector(actorRef, (s) => s.context.error) || '';
    const loading = useSelector(actorRef, (s) => s.matches('submitting'));

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
                send({ type: 'backup code submitted', code: safeCode });
            }}
            method="post"
        >
            <TotpRecoveryCodeInputField
                code={code}
                error={validator([requiredError]) || error}
                loading={loading}
                setCode={setCode}
                bigger
            />

            <Button size="large" fullWidth color="norm" type="submit" loading={loading} className="mb-2 mt-4">
                {c('Action').t`Authenticate`}
            </Button>
            <Button size="large" fullWidth onClick={() => send({ type: 'try another way' })}>
                {c('Action').t`I don’t have my backup codes`}
            </Button>
        </form>
    );
};

export const RequestTotpBackupCodesStep = () => {
    const totpBackupCodesActorRef = useTotpBackupCodesActorRef();

    const requestBackupCode = useSelector(totpBackupCodesActorRef, (s) => s.matches('request backup code'));

    const { sendStepLoad } = useUnauthedLost2FATelemetry();
    useEffect(() => {
        if (!requestBackupCode) {
            return;
        }

        sendStepLoad('request totp backup codes');
    }, [requestBackupCode]);

    return <RequestCodes actorRef={totpBackupCodesActorRef} />;
};
