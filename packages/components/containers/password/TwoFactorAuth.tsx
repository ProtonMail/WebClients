import { type MutableRefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Form from '@proton/components/components/form/Form';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthSecurityKeyContent from '@proton/components/containers/account/fido/AuthSecurityKeyContent';
import { TotpInputField, TotpRecoveryCodeInputField } from '@proton/components/containers/account/totp/TotpInputs';
import type { TwoFactorCredentials } from '@proton/shared/lib/api/auth';
import type { Fido2Response } from '@proton/shared/lib/authentication/interface';
import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { type AuthenticationCredentialsPayload, getAuthentication } from '@proton/shared/lib/webauthn/get';
import isTruthy from '@proton/utils/isTruthy';

interface TOTPFormProps {
    formId?: string;
    onSubmit: (value: string) => void;
    loading?: boolean;
    hasBeenAutoSubmitted: MutableRefObject<boolean>;
    defaultType: 'totp' | 'recovery-code';
}
const TOTPForm = ({ formId, onSubmit, loading, hasBeenAutoSubmitted, defaultType }: TOTPFormProps) => {
    const { validator, onFormSubmit, reset } = useFormErrors();
    const [code, setCode] = useState('');
    const [type, setType] = useState(defaultType);

    const safeCode = code.replaceAll(/\s+/g, '');
    const requiredError = requiredValidator(safeCode);

    useEffect(() => {
        if (type !== 'totp' || loading || requiredError || hasBeenAutoSubmitted.current) {
            return;
        }
        // Auto-submit the form once the user has entered the TOTP
        if (safeCode.length === 6) {
            // Do it just one time
            hasBeenAutoSubmitted.current = true;
            onSubmit(safeCode);
        }
    }, [safeCode]);

    return (
        <Form
            id={formId}
            onSubmit={(event) => {
                if (!onFormSubmit(event.currentTarget) || loading) {
                    return;
                }
                onSubmit(safeCode);
            }}
        >
            {type === 'totp' ? (
                <TotpInputField code={code} error={validator([requiredError])} loading={loading} setCode={setCode} />
            ) : (
                <TotpRecoveryCodeInputField
                    code={code}
                    error={validator([requiredError])}
                    loading={loading}
                    setCode={setCode}
                    bigger
                />
            )}
            <div className="mt-4">
                <InlineLinkButton
                    type="button"
                    onClick={() => {
                        reset();
                        setCode('');
                        setType(type === 'totp' ? 'recovery-code' : 'totp');
                    }}
                >
                    {type === 'totp' ? c('Action').t`Use recovery code` : c('Action').t`Use authentication code`}
                </InlineLinkButton>
            </div>
        </Form>
    );
};

interface Fido2FormProps {
    formId?: string;
    onSubmit: (data: Promise<AuthenticationCredentialsPayload>) => void;
    twoFactorAuthRef?: MutableRefObject<TwoFactorAuthRef | undefined>;
    fido2: Fido2Response | null;
    loading?: boolean;
}
const Fido2Form = ({ formId, onSubmit, twoFactorAuthRef, fido2, loading }: Fido2FormProps) => {
    const [fidoError, setFidoError] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleAbort = useCallback(() => {
        const aborted = Boolean(abortControllerRef.current);
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        return aborted;
    }, []);

    useImperativeHandle(twoFactorAuthRef, () => ({
        abort: handleAbort,
    }));

    useEffect(() => {
        return () => {
            handleAbort();
        };
    }, []);

    return (
        <Form
            id={formId}
            onSubmit={() => {
                if (loading) {
                    return;
                }

                const getPayload = async () => {
                    try {
                        setFidoError(false);
                        if (!fido2) {
                            throw new Error('Missing fido2 data');
                        }
                        handleAbort();
                        const abortController = new AbortController();
                        abortControllerRef.current = abortController;

                        return await getAuthentication(fido2.AuthenticationOptions, abortController.signal);
                    } catch (error) {
                        setFidoError(true);
                        captureMessage('Security key auth', { level: 'error', extra: { error } });
                        // Purposefully logging the error for somewhat easier debugging
                        // eslint-disable-next-line no-console
                        console.error(error);
                        throw error;
                    } finally {
                        // It's important that it's aborted after failure/success so that extensions (LastPass) function correctly
                        // without a `OperationError: A request is already pending.`.
                        handleAbort();
                    }
                };

                // NOTE: The promise is resolved by the consumer outside of this component so that they can show a
                // loading spinner for example on the submit button.
                onSubmit(getPayload());
            }}
        >
            <AuthSecurityKeyContent error={fidoError} />
        </Form>
    );
};

export interface TwoFactorAuthRef {
    abort: () => boolean;
}

interface Props {
    onSubmit: (data: Promise<TwoFactorCredentials>) => void;
    fido2: Fido2Response | null;
    prioritised2FAItem?: 'totp' | 'fido2';
    formId?: string;
    twoFactor: TwoFactorAuthTypes;
    twoFactorAuthRef?: MutableRefObject<TwoFactorAuthRef | undefined>;
    loading?: boolean;
}

export const TwoFactorAuth = ({
    loading,
    formId,
    onSubmit,
    prioritised2FAItem,
    fido2,
    twoFactor,
    twoFactorAuthRef,
}: Props) => {
    const hasBeenAutoSubmitted = useRef(false);
    const [tabIndex, setTabIndex] = useState(0);

    const fido2Tab = twoFactor?.fido2 &&
        fido2 && {
            title: c('fido2: Label').t`Security key`,
            content: (
                <Fido2Form
                    twoFactorAuthRef={twoFactorAuthRef}
                    formId={formId}
                    fido2={fido2}
                    loading={loading}
                    onSubmit={(payload) => {
                        return onSubmit(
                            payload.then((resolvedPayload) => {
                                return { type: 'fido2', payload: resolvedPayload };
                            })
                        );
                    }}
                />
            ),
        };

    const totpTab = twoFactor?.totp && {
        title: c('Label').t`Authenticator app`,
        content: (
            <TOTPForm
                formId={formId}
                defaultType="totp"
                hasBeenAutoSubmitted={hasBeenAutoSubmitted}
                loading={loading}
                onSubmit={(payload) => {
                    return onSubmit(Promise.resolve({ type: 'code', payload }));
                }}
            />
        ),
    };

    const tabs = (() => {
        if (prioritised2FAItem === 'totp') {
            return [totpTab, fido2Tab];
        }

        return [fido2Tab, totpTab];
    })().filter(isTruthy);

    return <Tabs fullWidth value={tabIndex} onChange={setTabIndex} tabs={tabs} />;
};
