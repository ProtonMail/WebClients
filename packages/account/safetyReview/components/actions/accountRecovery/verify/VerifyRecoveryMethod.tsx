import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import throttle from 'lodash/throttle';
import { c } from 'ttag';

import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import { useCodeInput } from '@proton/account/safetyReview/verification/useCodeInput';
import type { VerificationMethod } from '@proton/account/safetyReview/verification/verification';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TotpInput from '@proton/components/components/v2/input/TotpInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import type { WithLoading } from '@proton/hooks/useLoading';
import { numberValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

type Props = SafetyReviewAllProps;

export const VerifyRecoveryMethod = (
    props: Props & {
        header?: ReactNode;
        value: ReactNode;
        method: VerificationMethod;
        onSuccess: () => void;
        onError: (error: unknown) => void;
        loading: boolean;
        withLoading: WithLoading;
    }
) => {
    const codeInput = useCodeInput();

    useEffect(() => {
        // The card may still be rendered in the background. This is a trigger to know that it's the topmost card.
        if (!props.firstItemId) {
            return;
        }

        codeInput.actions.handleInitiateVerification(props.method).catch(props.onError);

        // Display the "resend code" action after 2 seconds
        const timeoutHandle = setTimeout(() => {
            codeInput.actions.showResendCode();
        }, 2_000);

        return () => {
            clearTimeout(timeoutHandle);
        };
    }, [props.firstItemId]);

    const { validator, onFormSubmit, reset } = useFormErrors();

    const [code, setCode] = useState<string>('');
    const formRef = useRef<HTMLFormElement>(null);
    const hasBeenAutoSubmitted = useRef(false);
    const safeCode = code.replaceAll(/\s+/g, '');

    useEffect(() => {
        if (hasBeenAutoSubmitted.current) {
            return;
        }
        if (safeCode.length === 6) {
            try {
                hasBeenAutoSubmitted.current = true;
                formRef.current?.requestSubmit();
            } catch {}
        }
    }, [safeCode]);

    const sendNewCodeFn = useMemo(() => {
        const fn = async () => {
            try {
                if (!codeInput.state.token) {
                    return;
                }
                await codeInput.actions.handleSendNewCode(props.value, codeInput.state.token, props.method);
                reset();
            } catch (error) {
                props.onError(error);
            }
        };
        // Avoid spamming the API
        return throttle(fn, 2_000, { leading: true, trailing: false });
    }, [codeInput.state.token]);

    const sendANewCode = (
        <InlineLinkButton key="resend" disabled={props.loading} onClick={sendNewCodeFn} className="mt-2">
            {c('Safety review').t`Send a new code`}
        </InlineLinkButton>
    );

    return (
        <form
            id={props.firstItemId}
            ref={formRef}
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                props.withLoading(codeInput.actions.handleSubmit(code, props.method).then(props.onSuccess)).catch(noop);
            }}
        >
            {props.header}
            <InputFieldTwo
                as={TotpInput}
                autoFocus
                length={6}
                value={code}
                onValue={(value: string) => {
                    setCode(value);
                    codeInput.actions.resetCodeError();
                }}
                error={validator([
                    requiredValidator(code),
                    numberValidator(code),
                    code.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                    codeInput.state.codeError,
                ])}
            />
            {codeInput.state.showResendCode && codeInput.state.token ? (
                <div className="mt-2 text-center">{c('safety_review').jt`Didn’t receive it? ${sendANewCode}`}</div>
            ) : null}
        </form>
    );
};
