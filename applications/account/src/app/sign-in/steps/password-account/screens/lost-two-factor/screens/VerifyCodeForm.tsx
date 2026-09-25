import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TotpInput from '@proton/components/components/v2/input/TotpInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { getEmailVerificationCodeText, getSMSVerificationCodeText } from '../../../../../../content/helper';
import RequestNewCodeModal from '../../../../../../unauthed-forgot-password/components/RequestNewCodeModal';
import {
    useNewCodeLinks,
    useNotifyCodeSent,
} from '../../../../../../unauthed-forgot-password/hooks/useRequestNewVerificationCode';
import { Lost2FAContext } from '../Lost2FAContext';
import {
    Lost2FAStateMachineTags,
    type VerificationMethod,
    selectEmailVerificationResult,
    selectPhoneVerificationResult,
} from '../state-machine/lost2FAStateMachine';

/** The code sent to the recovery email or phone; the flow checks it and disables two-factor authentication. */
export const VerifyCodeForm = ({ method }: { method: VerificationMethod }) => {
    const actorRef = Lost2FAContext.useActorRef();
    const destination = Lost2FAContext.useSelector(
        (snapshot) =>
            (method === 'email' ? selectEmailVerificationResult : selectPhoneVerificationResult)(snapshot)
                ?.verificationDataResult.ChallengeDestination ?? ''
    );
    const invalidCode = Lost2FAContext.useSelector((snapshot) => snapshot.context.invalidCode);
    const submitting = Lost2FAContext.useSelector((snapshot) => snapshot.hasTag(Lost2FAStateMachineTags.submitting));
    const [code, setCode] = useState('');
    const newCodeDialogOpen = Lost2FAContext.useSelector((snapshot) =>
        snapshot.hasTag(Lost2FAStateMachineTags.newCodeDialog)
    );
    const resending = Lost2FAContext.useSelector((snapshot) => snapshot.hasTag(Lost2FAStateMachineTags.resending));
    const { validator, onFormSubmit } = useFormErrors();

    const { InvalidCodeErrorMessage, AssistiveText } = useNewCodeLinks({
        onRequestNewCode: () => actorRef.send({ type: 'verification.newCodeRequested' }),
    });

    const notifyCodeSent = useNotifyCodeSent();
    const notifyCodeSentRef = useRef(notifyCodeSent);
    useLayoutEffect(() => {
        notifyCodeSentRef.current = notifyCodeSent;
    });
    useEffect(() => {
        const subscription = actorRef.on('verification.codeResent', () => {
            setCode('');
            notifyCodeSentRef.current();
        });
        return () => subscription.unsubscribe();
    }, [actorRef]);

    const destinationElement = <b key={`recovery-${method}`}>{destination}</b>;

    return (
        <Form
            onSubmit={() => {
                if (!submitting && onFormSubmit()) {
                    actorRef.send({ type: 'verification.codeSubmitted', code });
                }
            }}
        >
            <div className="mb-4">
                {c('Info').t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
            </div>
            <div className="mb-4">
                {method === 'email'
                    ? getEmailVerificationCodeText(destinationElement)
                    : getSMSVerificationCodeText(destinationElement)}
            </div>
            <InputFieldTwo
                label={
                    method === 'email'
                        ? // translator: 'code' here refers to a 6 digit code sent to the users recovery email inbox
                          c('Action').t`Enter code`
                        : // translator: 'code' here refers to a 6 digit code sent to the users recovery phone via SMS
                          c('Action').t`Enter code`
                }
                as={TotpInput}
                autoFocus
                length={6}
                value={code}
                onValue={(value: string) => {
                    setCode(value);
                    actorRef.send({ type: 'verification.codeEdited' });
                }}
                error={
                    validator([
                        requiredValidator(code),
                        numberValidator(code),
                        code.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                    ]) || (invalidCode ? InvalidCodeErrorMessage : undefined)
                }
                assistiveText={AssistiveText}
            />
            <Button size="large" color="danger" type="submit" fullWidth loading={submitting} className="mb-2 mt-4">
                {c('Action').t`Disable`}
            </Button>
            <Button size="large" fullWidth onClick={() => actorRef.send({ type: 'lost2FA.otherMethodRequested' })}>
                {c('Action').t`Verify another way`}
            </Button>
            <RequestNewCodeModal
                method={method}
                value={destination}
                open={newCodeDialogOpen}
                loading={resending}
                onResend={() => actorRef.send({ type: 'verification.resendRequested' })}
                onClose={() => actorRef.send({ type: 'verification.newCodeDialogClosed' })}
            />
        </Form>
    );
};
