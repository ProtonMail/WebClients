import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputField } from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useNewCodeLinks, useNotifyCodeSent } from '../hooks/useNewCodeLinks';
import {
    selectBackWaits,
    selectInvalidCode,
    selectNewCodeDialogOpen,
    selectResending,
    selectSubmitting,
} from '../state-machine/UnauthedForgotPasswordStateMachine';
import type { CodeMethod } from '../state-machine/forgotPasswordActors';
import { ForgotPasswordContext } from '../wizard/ForgotPasswordContext';
import RequestNewCodeModal from './RequestNewCodeModal';

interface Props {
    method: CodeMethod;
    /** Where the code went, redacted, for the new code dialog. */
    destination: string;
    /**
     * False while the email code is being sent, as its step opens: Verify waits for it, so checking a code never races
     * the send.
     */
    awaitingCode?: boolean;
}

/** The code sent to the recovery email or phone; the machine checks it, and sends a new one from the dialog. */
export const ResetCodeForm = ({ method, destination, awaitingCode = true }: Props) => {
    const actorRef = ForgotPasswordContext.useActorRef();
    const loading = ForgotPasswordContext.useSelector(selectSubmitting);
    // While the code is sent or checked, "Try another way" waits for it, as the machine does
    const skipWaits = ForgotPasswordContext.useSelector(selectBackWaits);
    const invalidCode = ForgotPasswordContext.useSelector(selectInvalidCode);
    const newCodeDialogOpen = ForgotPasswordContext.useSelector(selectNewCodeDialogOpen);
    const resending = ForgotPasswordContext.useSelector(selectResending);
    const [code, setCode] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const { InvalidCodeErrorMessage, AssistiveText } = useNewCodeLinks({
        onRequestNewCode: () => actorRef.send({ type: 'newCode.requested' }),
    });

    const notifyCodeSent = useNotifyCodeSent();
    useEffect(() => {
        const subscription = actorRef.on('code.resent', () => {
            setCode('');
            notifyCodeSent();
        });
        return () => subscription.unsubscribe();
    }, [actorRef, notifyCodeSent]);

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!awaitingCode || loading || !onFormSubmit()) {
                        return;
                    }
                    // A pasted code can bring spaces, which the check ignores but the reset refuses
                    actorRef.send({ type: 'code.submitted', payload: { code: code.trim() } });
                }}
            >
                <InputField
                    id="reset-token"
                    bigger
                    label={c('Label').t`Enter code`}
                    error={validator([requiredValidator(code)]) || (invalidCode ? InvalidCodeErrorMessage : undefined)}
                    disableChange={loading}
                    value={code}
                    onValue={(value: string) => {
                        setCode(value);
                        actorRef.send({ type: 'code.edited' });
                    }}
                    autoFocus
                    assistiveText={AssistiveText}
                />
                <Button
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    loading={loading}
                    // Without the disabled look: the code is usually sent within a second
                    disabled={!awaitingCode}
                    noDisabledStyles={!awaitingCode}
                    className="mt-6"
                >
                    {c('Action').t`Verify`}
                </Button>

                <Button
                    size="large"
                    fullWidth
                    className="mt-2"
                    disabled={skipWaits}
                    noDisabledStyles={skipWaits}
                    onClick={() => actorRef.send({ type: 'decision.skip' })}
                >
                    {c('Action').t`Try another way`}
                </Button>
            </form>
            <RequestNewCodeModal
                method={method === 'sms' ? 'phone' : 'email'}
                value={destination}
                open={newCodeDialogOpen}
                loading={resending}
                onResend={() => actorRef.send({ type: 'newCode.confirmed' })}
                onClose={() => actorRef.send({ type: 'newCode.dismissed' })}
            />
        </>
    );
};
