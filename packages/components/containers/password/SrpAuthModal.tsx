import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { TwoFactorAuth, type TwoFactorAuthRef } from '@proton/components/containers/password/TwoFactorAuth';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useLoading } from '@proton/hooks';
import { PASSWORD_WRONG_ERROR, type TwoFactorCredentials, getInfo } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import type { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import type { TwoFactorAuthTypes } from '@proton/shared/lib/authentication/twoFactor';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Unwrap } from '@proton/shared/lib/interfaces';
import { type Credentials, srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { getReAuthTwoFactorTypes } from './getReAuthTwoFactorTypes';
import type { OwnAuthModalProps, SrpAuthModalResult } from './interface';

const FORM_ID = 'auth-form';

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

enum Step {
    Password,
    TWO_FA,
}

export interface SrpAuthModalProps
    extends
        Omit<OwnAuthModalProps, 'onSuccess'>,
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
    data?: { infoResult?: InfoAuthedResponse; twoFactor: TwoFactorAuthTypes };
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
    const errorHandler = useErrorHandler();
    const initialInfoRef = useRef(initialInfo);
    const infoResultRef = useRef(
        getInitialInfoResultRef({
            infoResult: initialInfo,
            scope,
            userSettings,
            app: APP_NAME,
        })
    );
    const twoFactorAuthRef = useRef<TwoFactorAuthRef>();

    const [password, setPassword] = useState('');
    const [rerender, setRerender] = useState(0);

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
        twoFaCredentials,
    }: {
        step: Step;
        password: string;
        twoFaCredentials: TwoFactorCredentials | null;
    }) => {
        if (submitting) {
            return;
        }

        let infoResult: Unwrap<ReturnType<typeof getInfoResult>>;
        let twoFactor: TwoFactorAuthTypes;
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

        try {
            const credentials: Credentials = {
                password,
                ...(twoFaCredentials?.type === 'code' ? { totp: twoFaCredentials.payload } : undefined),
                ...(twoFaCredentials?.type === 'fido2' ? { fido2: twoFaCredentials.payload } : undefined),
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
        if (twoFactorAuthRef.current?.abort()) {
            return;
        }
        if (loading) {
            return;
        }
        return cancelClose();
    };

    const infoResult = infoResultRef.current.data?.infoResult;
    const twoFactor = infoResultRef.current.data?.twoFactor;
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
                                withSubmitting(handleSubmit({ step, password, twoFaCredentials: null })).catch(noop);
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
                    if (step !== Step.TWO_FA || !twoFactor) {
                        return null;
                    }

                    return (
                        <TwoFactorAuth
                            formId={FORM_ID}
                            twoFactor={twoFactor}
                            fido2={infoResult?.['2FA']?.FIDO2 || null}
                            loading={submitting}
                            onSubmit={(twoFaCredentialsPromise) => {
                                const run = async () => {
                                    return handleSubmit({
                                        step,
                                        password,
                                        twoFaCredentials: await twoFaCredentialsPromise,
                                    });
                                };
                                withSubmitting(run()).catch(noop);
                            }}
                            prioritised2FAItem={prioritised2FAItem}
                            twoFactorAuthRef={twoFactorAuthRef}
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
