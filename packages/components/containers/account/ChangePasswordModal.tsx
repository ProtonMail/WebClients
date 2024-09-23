import { useState } from 'react';

import { c } from 'ttag';

import { signoutAction } from '@proton/account';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useDispatch } from '@proton/redux-shared-store';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { disable2FA as disable2FAConfig } from '@proton/shared/lib/api/settings';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import innerMutatePassword from '@proton/shared/lib/authentication/mutate';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { getIsRecoveryAvailable } from '@proton/shared/lib/helpers/recovery';
import type { Address } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getIsPasswordless } from '@proton/shared/lib/keys';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import {
    useApi,
    useAuthentication,
    useBeforeUnload,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useGetOrganizationKey,
    useGetUserKeys,
    useNotifications,
    useUser,
} from '../../hooks';
import GenericError from '../error/GenericError';
import AuthModal from '../password/AuthModal';
import { handleChangeLoginPassword } from './changePasswordHelper';

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
    totp: string;
}

interface Errors {
    loginError: string;
    fatalError: boolean;
    persistError?: boolean;
}

const DEFAULT_ERRORS: Errors = {
    loginError: '',
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
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const getOrganizationKey = useGetOrganizationKey();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const { validator, onFormSubmit, reset } = useFormErrors();

    const disable2FA = signedInRecoveryFlow;
    const authCheck = !signedInRecoveryFlow;

    const lockAndClose = () => {
        void api(lockSensitiveSettings());
        onClose?.();
    };

    const [user] = useUser();

    const [inputs, setInputs] = useState<Inputs>({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        totp: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Errors>(DEFAULT_ERRORS);
    const [isSecondPhase, setSecondPhase] = useState<boolean>(false);

    useBeforeUnload(loading ? c('Info').t`By leaving now, changes may not be saved` : '');

    const setPartialError = (object: Partial<Errors>) => setErrors((oldState) => ({ ...oldState, ...object }));
    const setPartialInput = (object: Partial<Inputs>) => setInputs((oldState) => ({ ...oldState, ...object }));
    const resetErrors = () => setErrors(DEFAULT_ERRORS);

    const newPasswordError = passwordLengthValidator(inputs.newPassword);
    const confirmPasswordError =
        passwordLengthValidator(inputs.confirmPassword) ||
        confirmPasswordValidator(inputs.newPassword, inputs.confirmPassword);

    const validateNewPasswords = () => {
        if (newPasswordError || confirmPasswordError) {
            throw new Error('Password error');
        }
    };

    const checkLoginError = ({ data: { Code, Error } = { Code: 0, Error: '' } }) => {
        if (Code === PASSWORD_WRONG_ERROR) {
            setPartialError({
                ...DEFAULT_ERRORS,
                loginError: Error,
            });
        }
    };

    const checkFatalError = (e: Error) => {
        if (e.name === 'NoDecryptedKeys') {
            setPartialError({ fatalError: true });
        }
    };

    const notifySuccess = () => {
        createNotification({ text: c('Success').t`Password updated` });
        onSuccess?.();
    };

    const mutatePassword = async ({
        keyPassword,
        clearKeyPassword,
    }: {
        keyPassword: string;
        clearKeyPassword: string;
    }) => {
        try {
            await innerMutatePassword({
                api,
                authentication,
                keyPassword,
                clearKeyPassword,
                User: user,
            });
        } catch (e: any) {
            // If persisting the password fails for some reason.
            setPartialError({ fatalError: true, persistError: true });
            throw e;
        }
    };

    const getModalProperties = (mode: MODES): ModalProperties => {
        if ([MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE, MODES.CHANGE_ONE_PASSWORD_MODE].includes(mode)) {
            if (user.isSubUser) {
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
                async onSubmit() {
                    if (!onFormSubmit()) {
                        return;
                    }
                    try {
                        validateNewPasswords();
                        resetErrors();
                        setLoading(true);

                        await handleChangeLoginPassword({ api, newPassword: inputs.newPassword });

                        notifySuccess();
                        lockAndClose();
                    } catch (e: any) {
                        setLoading(false);
                        checkLoginError(e);
                    }
                },
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
                async onSubmit() {
                    if (!onFormSubmit()) {
                        return;
                    }

                    try {
                        validateNewPasswords();
                        resetErrors();
                        setLoading(true);

                        await handleChangeLoginPassword({
                            api,
                            newPassword: inputs.newPassword,
                            persistPasswordScope: true,
                        });

                        setSecondPhase(true);
                        setInputs({
                            newPassword: '',
                            confirmPassword: '',
                            totp: '',
                            oldPassword: '',
                        });
                        reset();
                        setLoading(false);
                    } catch (e: any) {
                        setLoading(false);
                        checkLoginError(e);
                    }
                },
            };
        }

        const getAddressesWithKeysList = (addresses: Address[]) => {
            return Promise.all(
                addresses.map(async (address) => {
                    return {
                        address,
                        keys: await getAddressKeys(address.ID),
                    };
                })
            );
        };

        if (mode === MODES.SWITCH_TWO_PASSWORD && isSecondPhase) {
            return {
                title: c('Title').t`Switch to two-password mode`,
                labels: {
                    newPassword: c('Label').t`New second password`,
                    confirmPassword: c('Label').t`Confirm second password`,
                },
                async onSubmit() {
                    if (!onFormSubmit()) {
                        return;
                    }

                    try {
                        // Stop the event manager to prevent race conditions
                        stop();

                        const [addresses, userKeysList, organizationKey] = await Promise.all([
                            getAddresses(),
                            getUserKeys(),
                            getOrganizationKey(),
                        ]);

                        validateNewPasswords();
                        resetErrors();
                        setLoading(true);

                        const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(
                            inputs.newPassword
                        );
                        const addressesKeys = await getAddressesWithKeysList(addresses);
                        const updateKeysPayload = await getUpdateKeysPayload(
                            addressesKeys,
                            userKeysList,
                            getIsPasswordless(organizationKey?.Key) ? undefined : organizationKey?.privateKey,
                            keyPassword,
                            keySalt
                        );

                        await api(updatePrivateKeyRoute(updateKeysPayload));

                        await mutatePassword({ keyPassword, clearKeyPassword: inputs.newPassword });
                        await call();

                        notifySuccess();
                        lockAndClose();
                    } catch (e: any) {
                        setLoading(false);
                        checkFatalError(e);
                    } finally {
                        start();
                    }
                },
            };
        }

        const onSubmit = async () => {
            if (!onFormSubmit()) {
                return;
            }

            try {
                stop();

                const [addresses, userKeysList, organizationKey] = await Promise.all([
                    getAddresses(),
                    getUserKeys(),
                    getOrganizationKey(),
                ]);

                /**
                 * This is the case for a user who does not have any keys set-up.
                 * They will be in 2-password mode, but not have any keys.
                 * Changing to one-password mode or mailbox password is not allowed.
                 * It's not handled better because it's a rare case.
                 */
                if (userKeysList.length === 0) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Please generate keys before you try to change your password`,
                    });
                    return;
                }
                validateNewPasswords();
                resetErrors();
                setLoading(true);

                const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(
                    inputs.newPassword
                );

                const addressesWithKeys = await getAddressesWithKeysList(addresses);
                const updateKeysPayload = await getUpdateKeysPayload(
                    addressesWithKeys,
                    userKeysList,
                    getIsPasswordless(organizationKey?.Key) ? undefined : organizationKey?.privateKey,
                    keyPassword,
                    keySalt
                );

                const routeConfig = updatePrivateKeyRoute({ ...updateKeysPayload, PersistPasswordScope: disable2FA });
                const credentials = {
                    password: inputs.newPassword,
                    totp: inputs.totp,
                };

                if (mode === MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE) {
                    await api(routeConfig);
                } else {
                    await srpVerify({
                        api,
                        credentials,
                        config: routeConfig,
                    });
                }
                await mutatePassword({ keyPassword, clearKeyPassword: inputs.newPassword });

                if (disable2FA) {
                    await srpVerify({
                        api,
                        credentials,
                        config: disable2FAConfig(),
                    });
                }

                await call();

                notifySuccess();
                lockAndClose();
            } catch (e: any) {
                setLoading(false);
                checkFatalError(e);
                checkLoginError(e);
            } finally {
                start();
            }
        };

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
                onSubmit,
            };
        }

        if (mode === MODES.CHANGE_ONE_PASSWORD_MODE) {
            return {
                ...getModalProperties(mode),
                onSubmit,
            };
        }

        if (mode === MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE) {
            return {
                title: c('Title').t`Change second password`,
                labels: {
                    newPassword: c('Label').t`New second password`,
                    confirmPassword: c('Label').t`Confirm second password`,
                },
                onSubmit,
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
            if (errors.persistError) {
                // If there was an error persisting the session, we have no choice but to logout
                dispatch(signoutAction({ clearDeviceRecovery: true }));
            }
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

    return (
        <Modal as={Form} onClose={handleClose} {...rest} onSubmit={onSubmit}>
            <ModalHeader title={title} />
            <ModalContent>
                {description}
                <div className="mb-4">
                    {c('Info')
                        .t`${BRAND_NAME}'s encryption technology means that nobody can access your password - not even us.`}
                </div>
                {getIsRecoveryAvailable(user) && !signedInRecoveryFlow ? (
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
                    id="newPassword"
                    label={labels.newPassword}
                    placeholder={c('Placeholder').t`Password`}
                    error={validator([
                        requiredValidator(inputs.newPassword),
                        passwordLengthValidator(inputs.newPassword),
                    ])}
                    as={PasswordInputTwo}
                    autoFocus
                    autoComplete="new-password"
                    value={inputs.newPassword}
                    onValue={(value: string) => setPartialInput({ newPassword: value })}
                    disabled={loading}
                />

                <InputFieldTwo
                    key={`${isSecondPhase}${labels.confirmPassword}`}
                    id="confirmPassword"
                    label={labels.confirmPassword}
                    placeholder={c('Placeholder').t`Confirm`}
                    error={validator([
                        requiredValidator(inputs.confirmPassword),
                        passwordLengthValidator(inputs.confirmPassword),
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
        </Modal>
    );
};

export default ChangePasswordModal;
