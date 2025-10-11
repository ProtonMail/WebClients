import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Tabs from '@proton/components/components/tabs/Tabs';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthSecurityKeyContent from '@proton/components/containers/account/fido/AuthSecurityKeyContent';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useLoading } from '@proton/hooks';
import { PASSWORD_WRONG_ERROR, getInfo } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import type { Fido2Data, InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Unwrap } from '@proton/shared/lib/interfaces';
import { srpAuth } from '@proton/shared/lib/srp';
import { getAuthentication } from '@proton/shared/lib/webauthn/get';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import TotpInputs from '../account/totp/TotpInputs';
import { getReAuthTwoFactorTypes } from './getReAuthTwoFactorTypes';
import type { OwnAuthModalProps, SrpAuthModalResult } from './interface';

const FORM_ID = 'auth-form';

const TOTPForm = ({
    onSubmit,
    loading,
    hasBeenAutoSubmitted,
    defaultType,
}: {
    onSubmit: (value: string) => void;
    loading?: boolean;
    hasBeenAutoSubmitted: MutableRefObject<boolean>;
    defaultType: 'totp' | 'recovery-code';
}) => {
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
            id={FORM_ID}
            onSubmit={(event) => {
                if (!onFormSubmit(event.currentTarget) || loading) {
                    return;
                }
                onSubmit(safeCode);
            }}
        >
            <TotpInputs
                type={type}
                code={code}
                error={validator([requiredError])}
                loading={loading}
                setCode={setCode}
            />
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

const PasswordForm = ({
    defaultPassword,
    onSubmit,
    loading,
    accessType = AccessType.Self,
}: {
    accessType?: AccessType;
    defaultPassword: string;
    onSubmit: (password: string) => void;
    loading: boolean;
}) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [password, setPassword] = useState(defaultPassword);
    const { label, info } = (() => {
        if (accessType === AccessType.EmergencyAccess) {
            return {
                info: c('Info').t`Enter your own password (as trusted contact).`,
                label: c('Label').t`Your password (trusted contact)`,
            };
        }
        if (accessType === AccessType.AdminAccess) {
            return {
                info: c('Info').t`Enter your own password (as organization admin).`,
                label: c('Label').t`Your password (admin)`,
            };
        }
        return {
            info: null,
            label: c('Label').t`Password`,
        };
    })();
    return (
        <Form
            id={FORM_ID}
            onSubmit={(event) => {
                if (!onFormSubmit(event.currentTarget) || loading) {
                    return;
                }
                onSubmit(password);
            }}
        >
            {info && <div className="mb-4">{info}</div>}
            <InputFieldTwo
                autoFocus
                autoComplete="current-password"
                id="password"
                as={PasswordInputTwo}
                value={password}
                disableChange={loading}
                onValue={setPassword}
                error={validator([requiredValidator(password)])}
                label={label}
                placeholder={c('Placeholder').t`Password`}
            />
        </Form>
    );
};

type TwoFactorData = { type: 'code'; payload: string } | { type: 'fido2'; payload: Promise<Fido2Data> };

const getTwoFaCredentials = async (
    twoFa: TwoFactorData | undefined
): Promise<{ totp: string } | { fido2: Fido2Data } | undefined> => {
    if (twoFa?.type === 'code') {
        return {
            totp: twoFa.payload,
        } as const;
    }
    if (twoFa?.type === 'fido2') {
        return {
            fido2: await twoFa.payload,
        } as const;
    }
};

enum Step {
    Password,
    TWO_FA,
}

export interface SrpAuthModalProps
    extends Omit<OwnAuthModalProps, 'onSuccess'>,
        Omit<ModalProps<'div'>, 'as' | 'onSubmit' | 'size' | 'onSuccess' | 'onError'> {
    onSuccess?: (data: SrpAuthModalResult) => Promise<void> | void;
    info?: InfoAuthedResponse;
}

const getInitialInfoResultRef = ({
    infoResult,
    scope,
    userSettings,
    app,
}: Parameters<typeof getReAuthTwoFactorTypes>[0]): {
    data?: { infoResult?: InfoAuthedResponse; twoFactor: ReturnType<typeof getReAuthTwoFactorTypes> };
} => {
    if (!infoResult) {
        return {};
    }

    const twoFactor = getReAuthTwoFactorTypes({ scope, infoResult, userSettings, app });
    return {
        data: {
            infoResult,
            twoFactor,
        },
    };
};

const SrpAuthModal = ({
    config,
    onSuccess,
    onError,
    onClose,
    onCancel,
    prioritised2FAItem = 'fido2',
    onRecoveryClick,
    scope,
    info: initialInfo,
    ...rest
}: SrpAuthModalProps) => {
    const { APP_NAME } = useConfig();
    const api = useApi();
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [step, setStep] = useState(Step.Password);
    const [submitting, withSubmitting] = useLoading();
    const hasBeenAutoSubmitted = useRef(false);
    const errorHandler = useErrorHandler();
    const [fidoError, setFidoError] = useState(false);
    const initialInfoRef = useRef(initialInfo);
    const infoResultRef = useRef(
        getInitialInfoResultRef({
            infoResult: initialInfo,
            scope,
            userSettings,
            app: APP_NAME,
        })
    );

    const [password, setPassword] = useState('');
    const [rerender, setRerender] = useState(0);
    const [tabIndex, setTabIndex] = useState(0);

    const abortControllerRef = useRef<AbortController | null>(null);
    const handleAbort = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
    }, []);

    useEffect(() => {
        return handleAbort;
    }, []);

    const cancelClose = () => {
        onCancel?.();
        onClose?.();
    };

    const getInfoResult = async () => {
        const value = initialInfoRef.current;
        if (value) {
            initialInfoRef.current = undefined;
            return value;
        }
        return api<InfoAuthedResponse>(getInfo({ intent: 'Proton' }));
    };

    const handleSubmit = async ({
        step,
        password,
        twoFa,
    }: {
        step: Step;
        password: string;
        twoFa: TwoFactorData | undefined;
    }) => {
        if (submitting) {
            return;
        }

        let infoResult: Unwrap<ReturnType<typeof getInfoResult>>;
        let twoFactor: ReturnType<typeof getReAuthTwoFactorTypes>;
        try {
            infoResult = await getInfoResult();
            twoFactor = getReAuthTwoFactorTypes({ scope, infoResult, userSettings, app: APP_NAME });
        } catch (error) {
            errorHandler(error);
            return;
        }

        infoResultRef.current.data = { infoResult, twoFactor };

        if (step === Step.Password && twoFactor.enabled) {
            setPassword(password);
            setStep(Step.TWO_FA);
            return;
        }

        let twoFaCredentials: Unwrap<ReturnType<typeof getTwoFaCredentials>>;
        try {
            setFidoError(false);
            twoFaCredentials = await getTwoFaCredentials(twoFa);
        } catch (error) {
            if (twoFa?.type === 'fido2') {
                setFidoError(true);
                captureMessage('Security key auth', { level: 'error', extra: { error } });
                // Purposefully logging the error for somewhat easier debugging
                console.error(error);
            }
            return;
        }
        try {
            const credentials = {
                password,
                ...twoFaCredentials,
            };

            const response = await srpAuth({
                api,
                info: infoResult,
                credentials,
                config: {
                    ...config,
                    silence: true,
                },
            });
            // We want to just keep the modal open until the consumer's promise is finished. Not interested in errors.
            await onSuccess?.({ type: 'srp', credentials, response })?.catch(noop);
            onClose?.();
        } catch (error: any) {
            errorHandler(error);

            const { code } = getApiError(error);
            // Try again
            if (code === PASSWORD_WRONG_ERROR) {
                flushSync(() => {
                    setFidoError(false);
                    setPassword('');
                    setStep(Step.Password);
                    // Rerender the password form to trigger autofocus and form validation reset
                    setRerender((old) => ++old);
                });
                return;
            }

            onError?.(error);
            cancelClose();
        }
    };

    const loading = submitting;

    // Don't allow to close this modal if it's loading as it could leave other consumers in an undefined state
    const handleClose = () => {
        // First abort any ongoing requests. This allows a user to cancel a webauthn request that may have gotten overridden by an extension.
        // The intention is to just "cancel" the webauthn request and not close the modal.
        if (abortControllerRef.current) {
            handleAbort();
            return;
        }
        if (loading) {
            return;
        }
        return cancelClose();
    };

    const infoResult = infoResultRef.current.data?.infoResult;
    const twoFactor = infoResultRef.current.data?.twoFactor;
    const fido2 = infoResult?.['2FA']?.FIDO2;
    // This is optimistically determining if we should show "Continue" or "Authenticate" since we don't have the /info result yet
    // by looking at user settings.
    // NOTE: This will give wrong values for admins signed in as sub-users.
    const optimisticTwoFactorEnabled = twoFactor ? twoFactor.enabled : Boolean(userSettings?.['2FA']?.Enabled);

    return (
        <Modal {...rest} size="small" onClose={handleClose}>
            <ModalHeader
                title={
                    step === Step.TWO_FA ? c('Title').t`Two-factor authentication` : c('Title').t`Enter your password`
                }
            />
            <ModalContent>
                {step === Step.Password && (
                    <>
                        <PasswordForm
                            key={`${rerender}`}
                            accessType={user?.accessType}
                            defaultPassword={password}
                            onSubmit={(password) => {
                                return withSubmitting(handleSubmit({ step, password, twoFa: undefined })).catch(noop);
                            }}
                            loading={submitting}
                        />

                        {onRecoveryClick && (
                            <Button shape="underline" color="norm" onClick={onRecoveryClick}>
                                {c('Action').t`Forgot password?`}
                            </Button>
                        )}
                    </>
                )}
                {(() => {
                    if (step !== Step.TWO_FA) {
                        return null;
                    }

                    const fido2Tab = twoFactor?.fido2 &&
                        fido2 && {
                            title: c('fido2: Label').t`Security key`,
                            content: (
                                <Form
                                    id={FORM_ID}
                                    onSubmit={() => {
                                        const run = async () => {
                                            try {
                                                handleAbort();
                                                const abortController = new AbortController();
                                                abortControllerRef.current = abortController;

                                                await handleSubmit({
                                                    step,
                                                    password,
                                                    twoFa: {
                                                        type: 'fido2',
                                                        payload: getAuthentication(
                                                            fido2.AuthenticationOptions,
                                                            abortController.signal
                                                        ),
                                                    },
                                                });
                                            } finally {
                                                // It's important that it's aborted after failure/success so that extensions (LastPass) function correctly
                                                // without a `OperationError: A request is already pending.`.
                                                handleAbort();
                                            }
                                        };

                                        withSubmitting(run()).catch(noop);
                                    }}
                                >
                                    <AuthSecurityKeyContent error={fidoError} />
                                </Form>
                            ),
                        };

                    const totpTab = twoFactor?.totp && {
                        title: c('Label').t`Authenticator app`,
                        content: (
                            <TOTPForm
                                defaultType="totp"
                                hasBeenAutoSubmitted={hasBeenAutoSubmitted}
                                loading={submitting}
                                onSubmit={(payload) => {
                                    const run = async () => {
                                        await handleSubmit({
                                            step,
                                            password,
                                            twoFa: { type: 'code', payload },
                                        });
                                    };

                                    withSubmitting(run()).catch(noop);
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

                    return (
                        <Tabs
                            fullWidth
                            value={tabIndex}
                            onChange={(index) => {
                                // Abort any ongoing (webauthn) requests when changing the tab.
                                handleAbort();
                                setTabIndex(index);
                                setFidoError(false);
                            }}
                            tabs={tabs}
                        />
                    );
                })()}
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" form={FORM_ID} loading={submitting}>
                    {step === Step.Password && optimisticTwoFactorEnabled
                        ? c('Action').t`Continue`
                        : c('Action').t`Authenticate`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SrpAuthModal;
