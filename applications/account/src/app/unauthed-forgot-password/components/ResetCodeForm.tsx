import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useNewCodeLinks, useNotifyCodeSent } from '../hooks/useNewCodeLinks';
import {
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
}

/** The code sent to the recovery email or phone; the machine checks it, and sends a new one from the dialog. */
export const ResetCodeForm = ({ method, destination }: Props) => {
    const actorRef = ForgotPasswordContext.useActorRef();
    const loading = ForgotPasswordContext.useSelector(selectSubmitting);
    const invalidCode = ForgotPasswordContext.useSelector(selectInvalidCode);
    const newCodeDialogOpen = ForgotPasswordContext.useSelector(selectNewCodeDialogOpen);
    const resending = ForgotPasswordContext.useSelector(selectResending);
    const [code, setCode] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const { InvalidCodeErrorMessage, AssistiveText } = useNewCodeLinks({
        onRequestNewCode: () => actorRef.send({ type: 'newCode.requested' }),
    });

    const notifyCodeSent = useNotifyCodeSent();
    const notifyCodeSentRef = useRef(notifyCodeSent);
    useLayoutEffect(() => {
        notifyCodeSentRef.current = notifyCodeSent;
    });
    useEffect(() => {
        const subscription = actorRef.on('code.resent', () => {
            setCode('');
            notifyCodeSentRef.current();
        });
        return () => subscription.unsubscribe();
    }, [actorRef]);

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (loading || !onFormSubmit()) {
                        return;
                    }
                    actorRef.send({ type: 'code.submitted', payload: { code } });
                }}
            >
                <InputFieldTwo
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
                <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                    {c('Action').t`Verify`}
                </Button>

                <Button
                    size="large"
                    fullWidth
                    className="mt-2"
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
