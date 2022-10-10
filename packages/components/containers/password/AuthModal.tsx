import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { c } from 'ttag';

import AuthSecurityKeyContent from '@proton/components/containers/account/fido/AuthSecurityKeyContent';
import { PASSWORD_WRONG_ERROR, getInfo } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { Fido2Data, InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Unwrap } from '@proton/shared/lib/interfaces';
import { Credentials, SrpConfig, srpAuth } from '@proton/shared/lib/srp';
import { getAuthentication } from '@proton/shared/lib/webauthn/get';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import {
    Button,
    Form,
    InlineLinkButton,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    PasswordInputTwo,
    Tabs,
    useFormErrors,
} from '../../components';
import { useApi, useConfig, useErrorHandler, useLoading, useUser, useUserSettings } from '../../hooks';
import TotpInputs from '../account/totp/TotpInputs';
import { getAuthTypes } from './getAuthTypes';

const FORM_ID = 'auth-form';

enum Step {
    Password,
    TWO_FA,
}

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
            <div className="mt1">
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
    isSignedInAsAdmin,
}: {
    isSignedInAsAdmin: boolean;
    defaultPassword: string;
    onSubmit: (password: string) => void;
    loading: boolean;
}) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [password, setPassword] = useState(defaultPassword);
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
            {isSignedInAsAdmin && (
                <div className="mb1">{c('Info').t`Enter your own password (as organization admin).`}</div>
            )}
            <InputFieldTwo
                autoFocus
                autoComplete="current-password"
                id="password"
                as={PasswordInputTwo}
                value={password}
                disableChange={loading}
                onValue={setPassword}
                error={validator([requiredValidator(password)])}
                label={isSignedInAsAdmin ? c('Label').t`Your password (admin)` : c('Label').t`Password`}
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

interface Props extends Omit<ModalProps<'div'>, 'as' | 'onSubmit' | 'size' | 'onSuccess' | 'onError'> {
    config: SrpConfig;
    onSuccess?: (data: { credentials: Credentials; response: Response }) => Promise<void> | void;
    onCancel: (() => void) | undefined;
    onError?: (error: any) => void;
}

const AuthModal = ({ config, onSuccess, onError, onClose, onCancel, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const [infoResult, setInfoResult] = useState<InfoAuthedResponse>();
    const api = useApi();
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [step, setStep] = useState(Step.Password);
    const [submitting, withSubmitting] = useLoading();
    const hasBeenAutoSubmitted = useRef(false);
    const errorHandler = useErrorHandler();
    const [fidoError, setFidoError] = useState(false);

    const [password, setPassword] = useState('');
    const [rerender, setRerender] = useState(0);
    const [tabIndex, setTabIndex] = useState(0);

    const cancelClose = () => {
        onCancel?.();
        onClose?.();
    };

    const refresh = async () => {
        const infoResult = await api<InfoAuthedResponse>(getInfo());
        setInfoResult(infoResult);
    };

    const isLoadingAuth = !infoResult;
    const authTypes = getAuthTypes(infoResult, userSettings, APP_NAME);

    useEffect(() => {
        refresh().catch(cancelClose);
    }, []);

    const handleSubmit = async ({ password, twoFa }: { password: string; twoFa: TwoFactorData | undefined }) => {
        if (submitting || isLoadingAuth) {
            return;
        }

        let twoFaCredentials: Unwrap<ReturnType<typeof getTwoFaCredentials>>;
        try {
            setFidoError(false);
            twoFaCredentials = await getTwoFaCredentials(twoFa);
        } catch (error) {
            if (twoFa?.type === 'fido2') {
                setFidoError(true);
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
            await onSuccess?.({ credentials, response })?.catch(noop);
            onClose?.();
        } catch (error: any) {
            errorHandler(error);
            const { code } = getApiError(error);
            if (code !== PASSWORD_WRONG_ERROR) {
                onError?.(error);
                cancelClose();
                return;
            }
            await refresh().catch(cancelClose);
            flushSync(() => {
                setFidoError(false);
                setPassword('');
                setStep(Step.Password);
                // Rerender the password form to trigger autofocus and form validation reset
                setRerender((old) => ++old);
            });
        }
    };

    const loading = submitting || isLoadingAuth;

    // Don't allow to close this modal if it's loading as it could leave other consumers in an undefined state
    const handleClose = loading ? noop : cancelClose;

    const fido2 = infoResult?.['2FA']?.FIDO2;

    return (
        <Modal {...rest} size="small" onClose={handleClose}>
            <ModalHeader title={c('Title').t`Sign in again to continue`} />
            <ModalContent>
                {step === Step.Password && (
                    <PasswordForm
                        key={`${rerender}`}
                        isSignedInAsAdmin={user?.isSubUser}
                        defaultPassword={password}
                        onSubmit={(password) => {
                            if (isLoadingAuth) {
                                return;
                            }
                            if (authTypes.twoFactor) {
                                setPassword(password);
                                setStep(Step.TWO_FA);
                                return;
                            }
                            return withSubmitting(handleSubmit({ password, twoFa: undefined }));
                        }}
                        loading={submitting}
                    />
                )}
                {step === Step.TWO_FA && (
                    <Tabs
                        fullWidth
                        value={tabIndex}
                        onChange={(index) => {
                            setTabIndex(index);
                            setFidoError(false);
                        }}
                        tabs={[
                            authTypes.fido2 &&
                                fido2 && {
                                    title: c('fido2: Label').t`Security key`,
                                    content: (
                                        <Form
                                            id={FORM_ID}
                                            onSubmit={() => {
                                                withSubmitting(
                                                    handleSubmit({
                                                        password,
                                                        twoFa: {
                                                            type: 'fido2',
                                                            payload: getAuthentication(fido2.AuthenticationOptions),
                                                        },
                                                    })
                                                ).catch(noop);
                                            }}
                                        >
                                            <AuthSecurityKeyContent error={fidoError} />
                                        </Form>
                                    ),
                                },
                            authTypes.totp && {
                                title: c('Label').t`Authenticator app`,
                                content: (
                                    <TOTPForm
                                        defaultType="totp"
                                        hasBeenAutoSubmitted={hasBeenAutoSubmitted}
                                        loading={submitting}
                                        onSubmit={(payload) =>
                                            withSubmitting(
                                                handleSubmit({
                                                    password,
                                                    twoFa: { type: 'code', payload },
                                                })
                                            )
                                        }
                                    />
                                ),
                            },
                        ].filter(isTruthy)}
                    />
                )}
            </ModalContent>
            <ModalFooter>
                {step === Step.TWO_FA ? (
                    <Button
                        onClick={() => {
                            setFidoError(false);
                            setStep(Step.Password);
                        }}
                    >{c('Action').t`Back`}</Button>
                ) : (
                    <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                )}
                <Button color="norm" type="submit" form={FORM_ID} loading={submitting} disabled={isLoadingAuth}>
                    {step === Step.Password && authTypes.twoFactor
                        ? c('Action').t`Continue`
                        : c('Action').t`Authenticate`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AuthModal;
