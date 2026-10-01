import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { TotpRecoveryCodeInputField } from '@proton/components/containers/account/totp/TotpInputs';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import type { SignInScreen, SignInScreenProps } from '../../../../../../routes/signInRoute';
import { useSignInProps } from '../../../../../../wizard/SignInProvider';
import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAUsername } from '../../Lost2FAUsername';
import {
    selectAwaitingBackupCode,
    selectBackupCodeError,
    selectSubmitting,
} from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';

const RequestCodes = () => {
    const { send } = Lost2FAContext.useActorRef();
    const [code, setCode] = useState('');
    const error = Lost2FAContext.useSelector(selectBackupCodeError) || '';
    // Also while a valid code signs in: the form stays up, loading, until the sign-in completes
    const loading = Lost2FAContext.useSelector(selectSubmitting);

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
                send({ type: 'lost2FA.backupCodeSubmitted', payload: { code: safeCode } });
            }}
            method="post"
        >
            <TotpRecoveryCodeInputField
                code={code}
                error={validator([requiredError]) || error}
                loading={loading}
                setCode={(value: string) => {
                    setCode(value);
                    send({ type: 'lost2FA.backupCodeEdited' });
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

export const RequestTotpBackupCodesScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const requestBackupCode = Lost2FAContext.useSelector(selectAwaitingBackupCode);

    const { sendStepLoad } = useLost2FATelemetry();
    // Once, the first time the code is asked for: a rejected code asks for it again, on the same step
    const stepLoadSent = useRef(false);
    useEffect(() => {
        if (!requestBackupCode || stepLoadSent.current) {
            return;
        }
        stepLoadSent.current = true;
        sendStepLoad('request totp backup codes');
    }, [requestBackupCode]);

    return (
        <>
            <layout.Header
                title={c('Title').t`Use backup recovery code`}
                subTitle={<Lost2FAUsername />}
                onBack={onBack}
            />
            <layout.Body>
                <RequestCodes />
            </layout.Body>
        </>
    );
};
