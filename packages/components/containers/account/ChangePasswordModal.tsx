import { useState } from 'react';

import { c } from 'ttag';

import { changeLoginPassword, changePassword } from '@proton/account/password/actions';
import { usePasswordPolicies } from '@proton/account/passwordPolicies/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, Scroll } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PasswordPolicy, usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { getIsAccountRecoveryAvailable } from '@proton/shared/lib/helpers/recovery';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import PasswordStrengthIndicator, {
    useLoadPasswordStrengthIndicatorWasm,
} from '../../components/passwordStrengthIndicator/PasswordStrengthIndicator';
import GenericError from '../error/GenericError';

export enum MODES {
    CHANGE_ONE_PASSWORD_MODE = 1,
    CHANGE_TWO_PASSWORD_MAILBOX_MODE = 2,
    CHANGE_TWO_PASSWORD_LOGIN_MODE = 3,
    SWITCH_ONE_PASSWORD = 4,
    SWITCH_TWO_PASSWORD = 5,
}

interface Inputs {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface Errors {
    fatalError: boolean;
    persistError?: boolean;
}

const DEFAULT_ERRORS: Errors = {
    fatalError: false,
};

interface ModalProperties {
    title: string;
    description?: JSX.Element | null;
    labels: {
        newPassword: string;
        confirmPassword: string;
    };
    close?: string;
    submit?: string;
    onSubmit?: () => Promise<void>;
}

interface Props extends ModalProps {
    mode: MODES;
    onRecoveryClick?: () => void;
    onSuccess?: () => void;
    /**
     * Assumes password scope has been obtained through a recovery method verification
     * - Will skip showing the auth modal
     * - Will disable 2FA for the user
     */
    signedInRecoveryFlow?: boolean;
}

const ChangePasswordModal = ({
    mode,
    onRecoveryClick,
    onSuccess,
    onClose,
    signedInRecoveryFlow = false,
    ...rest
}: Props) => {
    const dispatch = useDispatch();
    const normalApi = useApi();
    const api = getSilentApi(normalApi);
    const { createNotification } = useNotifications();
    const passwordStrengthIndicator = useLoadPasswordStrengthIndicatorWasm();
    const { validator, onFormSubmit, reset } = useFormErrors();
    const handleError = useErrorHandler();

    const disable2FA = signedInRecoveryFlow;
    const authCheck = !signedInRecoveryFlow;

    const lockAndClose = () => {
        api(lockSensitiveSettings()).catch(noop);
        onClose?.();
    };

    const [user] = useUser();

    const [inputs, setInputs] = useState<Inputs>({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Errors>(DEFAULT_ERRORS);
    const [isSecondPhase, setSecondPhase] = useState<boolean>(false);

    useBeforeUnload(loading ? c('Info').t`By leaving now, changes may not be saved` : '');

    const setPartialError = (object: Partial<Errors>) => setErrors((oldState) => ({ ...oldState, ...object }));
    const setPartialInput = (object: Partial<Inputs>) => setInputs((oldState) => ({ ...oldState, ...object }));
    const resetErrors = () => setErrors(DEFAULT_ERRORS);

    const newPasswordError = passwordLengthValidator(inputs.newPassword);
    const confirmPasswordError = confirmPasswordValidator(inputs.newPassword, inputs.confirmPassword);
    const passwordPolicyValidation = usePasswordPolicyValidation(inputs.newPassword, usePasswordPolicies());
    const passwordPolicyError = !passwordPolicyValidation.valid;

    const validateNewPasswords = () => {
        return !(newPasswordError || confirmPasswordError || passwordPolicyError);
    };

    const notifySuccess = () => {
        createNotification({ text: c('Success').t`Password updated` });
        onSuccess?.();
    };

    const getModalProperties = (mode: MODES): ModalProperties => {
        if ([MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE, MODES.CHANGE_ONE_PASSWORD_MODE].includes(mode)) {
            if (!user.isSelf) {
                const userName = (
                    <b key="user" className="text-break">
                        {user.Name} ({user.Email})
                    </b>
                );
                return {
                    title: c('Title').t`Change password`,
                    description: <div className="mb-4">{c('Info').jt`Enter new password for user ${userName}.`}</div>,
                    labels: {
                        newPassword: c('Label').t`User's new password`,
                        confirmPassword: c('Label').t`Confirm new password`,
                    },
                    close: c('Action').t`Cancel`,
                    submit: c('Action').t`Change password`,
                };
            }

            if (mode === MODES.CHANGE_ONE_PASSWORD_MODE) {
                return {
                    title: c('Title').t`Change password`,
                    labels: {
                        newPassword: c('Label').t`New password`,
                        confirmPassword: c('Label').t`Confirm password`,
                    },
                };
            }

            return {
                title: c('Title').t`Change login password`,
                labels: {
                    newPassword: c('Label').t`New login password`,
                    confirmPassword: c('Label').t`Confirm login password`,
                },
            };
        }

        throw new Error('mode not supported');
    };

    const handleSubmitLoginPassword = async () => {
        if (!onFormSubmit() || !validateNewPasswords()) {
            return;
        }
        try {
            resetErrors();
            setLoading(true);

            await dispatch(
                changeLoginPassword({
                    api,
                    newPassword: inputs.newPassword,
                    persistPasswordScope: mode === MODES.SWITCH_TWO_PASSWORD,
                })
            );

            if (mode === MODES.SWITCH_TWO_PASSWORD) {
                setInputs({
                    newPassword: '',
                    confirmPassword: '',
                    oldPassword: '',
                });
                reset();
                setSecondPhase(true);
            } else {
                notifySuccess();
                lockAndClose();
            }
        } catch (e: any) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPassword = async () => {
        if (!onFormSubmit() || !validateNewPasswords()) {
            return;
        }

        try {
            resetErrors();
            setLoading(true);

            await dispatch(
                changePassword({
                    api,
                    newPassword: inputs.newPassword,
                    mode:
                        mode === MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE || mode === MODES.SWITCH_TWO_PASSWORD
                            ? 'two-password-mode'
                            : 'one-password-mode',
                    disable2FA,
                })
            );

            notifySuccess();
            lockAndClose();
        } catch (e: any) {
            if (e?.name === 'NoDecryptedKeys') {
                setPartialError({ fatalError: true });
            }
            handleError(e);
        } finally {
            setLoading(false);
        }
    };

    const {
        labels,
        description = null,
        title,
        close = undefined,
        submit = undefined,
        onSubmit,
    } = ((): ModalProperties => {
        if (mode === MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE) {
            return {
                ...getModalProperties(mode),
                onSubmit: handleSubmitLoginPassword,
            };
        }

        if (mode === MODES.SWITCH_TWO_PASSWORD && !isSecondPhase) {
            return {
                title: c('Title').t`Switch to two-password mode`,
                description: (
                    <div className="mb-4">
                        {c('Info')
                            .t`Two-password mode uses separate passwords for login and data decryption. This provides a minor security benefit in some situations, however we recommend one-password mode for most users. To switch to two password mode, first set a login password and then set a second password.`}
                    </div>
                ),
                labels: {
                    newPassword: c('Label').t`New login password`,
                    confirmPassword: c('Label').t`Confirm login password`,
                },
                onSubmit: handleSubmitLoginPassword,
            };
        }

        if (mode === MODES.SWITCH_TWO_PASSWORD && isSecondPhase) {
            return {
                title: c('Title').t`Switch to two-password mode`,
                labels: {
                    newPassword: c('Label').t`New second password`,
                    confirmPassword: c('Label').t`Confirm second password`,
                },
                onSubmit: handleSubmitPassword,
            };
        }

        if (mode === MODES.SWITCH_ONE_PASSWORD) {
            return {
                title: c('Title').t`Switch to one-password mode`,
                labels: {
                    newPassword: c('Label').t`New password`,
                    confirmPassword: c('Label').t`Confirm password`,
                },
                description: (
                    <div className="mb-4">
                        {c('Info')
                            .t`${MAIL_APP_NAME} can also be used with a single password which replaces both the login and second password. To switch to single password mode, enter the single password you would like to use and click Save.`}
                    </div>
                ),
                onSubmit: handleSubmitPassword,
            };
        }

        if (mode === MODES.CHANGE_ONE_PASSWORD_MODE) {
            return {
                ...getModalProperties(mode),
                onSubmit: handleSubmitPassword,
            };
        }

        if (mode === MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE) {
            return {
                title: c('Title').t`Change second password`,
                labels: {
                    newPassword: c('Label').t`New second password`,
                    confirmPassword: c('Label').t`Confirm second password`,
                },
                onSubmit: handleSubmitPassword,
            };
        }

        throw new Error('Unknown mode');
    })();

    const addARecoveryMethod = (
        <SettingsLink key="recovery-link" path="/recovery">{
            // translator: Make sure you add a recovery method so that you can get back into your account if you forget your password.
            c('Info').t`add a recovery method`
        }</SettingsLink>
    );

    const [authed, setAuthed] = useState(!authCheck);

    if (!authed) {
        return (
            <AuthModal
                scope="password"
                config={unlockPasswordChanges()}
                {...rest}
                onCancel={onClose}
                onSuccess={async () => {
                    setAuthed(true);
                }}
                onRecoveryClick={onRecoveryClick}
            />
        );
    }

    if (errors.fatalError) {
        const handleFatalErrorClose = () => {
            lockAndClose();
        };

        return (
            <Modal {...rest} onClose={handleFatalErrorClose}>
                <ModalHeader title={title} />
                <ModalContent>
                    <GenericError />
                </ModalContent>
                <ModalFooter>
                    <Button onClick={handleFatalErrorClose}>{close || c('Action').t`Cancel`}</Button>
                    <Button color="norm" onClick={handleFatalErrorClose}>
                        {submit || c('Action').t`OK`}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const handleClose = loading ? noop : lockAndClose;

    const firstError = passwordPolicyValidation.result.find((result) => !result.valid)?.errorMessage || '';

    return (
        <Modal
            size={passwordStrengthIndicator.supported ? 'xlarge' : undefined}
            as={Form}
            onClose={handleClose}
            {...rest}
            onSubmit={onSubmit}
        >
            <div className={clsx(passwordStrengthIndicator.supported && 'flex flex-nowrap h-full')}>
                <div className={clsx(passwordStrengthIndicator.supported && 'modal-two-dialog-container md:w-3/5')}>
                    <ModalHeader title={title} />
                    <ModalContent>
                        {description}
                        <div className="mb-4">
                            {c('Info')
                                .t`${BRAND_NAME}'s encryption technology means that nobody can access your password - not even us.`}
                        </div>
                        {getIsAccountRecoveryAvailable(user) && !signedInRecoveryFlow ? (
                            <div className="mb-4">
                                {
                                    // translator: Make sure you add a recovery method so that you can get back into your account if you forget your password.
                                    c('Info')
                                        .jt`Make sure you ${addARecoveryMethod} so that you can get back into your account if you forget your password.`
                                }
                            </div>
                        ) : null}

                        {disable2FA ? (
                            <div className="mb-4">{c('Info').t`This will remove any enabled 2FA methods.`}</div>
                        ) : null}

                        <InputFieldTwo
                            id="password"
                            label={labels.newPassword}
                            placeholder={c('Placeholder').t`Password`}
                            error={validator([
                                requiredValidator(inputs.newPassword),
                                // Don't display the password length error when the password policy validation is active
                                passwordPolicyValidation.enabled
                                    ? firstError
                                    : passwordLengthValidator(inputs.newPassword),
                            ])}
                            as={PasswordInputTwo}
                            autoFocus
                            autoComplete="new-password"
                            value={inputs.newPassword}
                            onValue={(value: string) => setPartialInput({ newPassword: value })}
                            disabled={loading}
                        />

                        {passwordStrengthIndicator.supported && !passwordPolicyValidation.enabled && (
                            <PasswordStrengthIndicator
                                service={passwordStrengthIndicator.service}
                                password={inputs.newPassword}
                                className="block md:hidden w-full mb-4"
                            />
                        )}

                        {passwordPolicyValidation.enabled && (
                            <div className="block md:hidden w-full mb-4">
                                <PasswordPolicy password={inputs.newPassword} wrapper={passwordPolicyValidation} />
                            </div>
                        )}

                        <InputFieldTwo
                            key={`${isSecondPhase}${labels.confirmPassword}`}
                            id="password-repeat"
                            label={labels.confirmPassword}
                            placeholder={c('Placeholder').t`Confirm`}
                            error={validator([
                                requiredValidator(inputs.confirmPassword),
                                confirmPasswordValidator(inputs.newPassword, inputs.confirmPassword),
                            ])}
                            as={PasswordInputTwo}
                            autoComplete="new-password"
                            value={inputs.confirmPassword}
                            onValue={(value: string) => setPartialInput({ confirmPassword: value })}
                            disabled={loading}
                        />
                    </ModalContent>
                    <ModalFooter>
                        <Button onClick={handleClose} disabled={loading}>
                            {close || c('Action').t`Cancel`}
                        </Button>
                        <Button loading={loading} type="submit" color="norm">
                            {submit || c('Action').t`Save`}
                        </Button>
                    </ModalFooter>
                </div>
                {passwordStrengthIndicator.supported && !passwordPolicyValidation.enabled && (
                    <div className="hidden md:flex w-2/5 border-left">
                        <Scroll>
                            <PasswordStrengthIndicator
                                service={passwordStrengthIndicator.service}
                                password={inputs.newPassword}
                                hideWhenEmpty={false}
                                variant="large"
                                showGeneratePasswordButton={true}
                                className="p-5"
                            />
                        </Scroll>
                    </div>
                )}
                {passwordPolicyValidation.enabled && (
                    <div className="hidden md:flex w-2/5 border-left">
                        <Scroll>
                            <PasswordPolicy
                                password={inputs.newPassword}
                                wrapper={passwordPolicyValidation}
                                variant="large"
                            />
                        </Scroll>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ChangePasswordModal;
