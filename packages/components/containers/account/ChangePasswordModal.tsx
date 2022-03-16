import { useState } from 'react';
import { c } from 'ttag';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys';
import { isSSOMode } from '@proton/shared/lib/constants';
import { persistSessionWithPassword } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { PASSWORD_CHANGE_MESSAGE_TYPE, sendMessageToTabs } from '@proton/shared/lib/helpers/crossTab';
import { noop } from '@proton/shared/lib/helpers/function';
import { updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { srpVerify } from '@proton/shared/lib/srp';
import { Address } from '@proton/shared/lib/interfaces';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';

import { handleUnlock, handleChangeLoginPassword } from './changePasswordHelper';
import {
    Alert,
    Button,
    Form,
    InputFieldTwo,
    Loader,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    PasswordInputTwo,
    SettingsLink,
    useFormErrors,
} from '../../components';

import { GenericError } from '../error';
import {
    useAuthentication,
    useEventManager,
    useNotifications,
    useApi,
    useUser,
    useGetUserKeys,
    useGetOrganizationKeyRaw,
    useBeforeUnload,
    useGetAddresses,
    useGetAddressKeys,
} from '../../hooks';
import { useAskAuth } from '../password';

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
        oldPassword?: string;
        newPassword: string;
        confirmPassword: string;
    };
    close?: string;
    submit?: string;
    onSubmit?: () => Promise<void>;
}

interface Props extends ModalProps {
    mode: MODES;
}

const ChangePasswordModal = ({ mode, onClose, ...rest }: Props) => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const getOrganizationKeyRaw = useGetOrganizationKeyRaw();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const { validator, onFormSubmit, reset } = useFormErrors();

    const [User] = useUser();

    const { isSubUser, isAdmin, Name, Email } = User;

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

    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth(() => {
        setPartialError({ fatalError: true });
    });

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
    };

    const mutatePassword = async (keyPassword: string) => {
        // Don't mutate the password when signed in as sub-user
        if (isSubUser) {
            return;
        }
        const localID = authentication.getLocalID?.();
        if (!isSSOMode || localID === undefined) {
            authentication.setPassword(keyPassword);
            return;
        }
        try {
            authentication.setPassword(keyPassword);

            await persistSessionWithPassword({
                api,
                keyPassword,
                User,
                UID: authentication.getUID(),
                LocalID: localID,
                persistent: authentication.getPersistent(),
            });
            sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, { localID, status: true });
        } catch (e: any) {
            sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, { localID, status: false });
            // If persisting the password fails for some reason.
            setPartialError({ fatalError: true, persistError: true });
            throw e;
        }
    };

    const getModalProperties = (mode: MODES): ModalProperties => {
        if ([MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE, MODES.CHANGE_ONE_PASSWORD_MODE].includes(mode)) {
            if (isSubUser) {
                return {
                    title: c('Title').t`Change password`,
                    description: (
                        <div className="mb1">
                            {c('Info')
                                .t`Enter your own password (as organization admin) and new password for this user ${Name} (${Email}).`}
                        </div>
                    ),
                    labels: {
                        oldPassword: c('Label').t`Your password (admin)`,
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
                        oldPassword: c('Label').t`Old password`,
                        newPassword: c('Label').t`New password`,
                        confirmPassword: c('Label').t`Confirm password`,
                    },
                };
            }

            return {
                title: c('Title').t`Change login password`,
                labels: {
                    oldPassword: c('Label').t`Old login password`,
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

                        await handleUnlock({ api, oldPassword: inputs.oldPassword, totp: inputs.totp });
                        await handleChangeLoginPassword({ api, newPassword: inputs.newPassword });
                        await api(lockSensitiveSettings());

                        notifySuccess();
                        onClose?.();
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
                    <div className="mb1">
                        {c('Info')
                            .t`Two-password mode uses separate passwords for login and mailbox decryption. This provides a minor security benefit in some situations, however we recommend one-password mode for most users. To switch to two password mode, first set a login password and then set a mailbox password.`}
                    </div>
                ),
                labels: {
                    oldPassword: isSubUser ? c('Label').t`Your password (admin)` : c('Label').t`Old password`,
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

                        await handleUnlock({ api, oldPassword: inputs.oldPassword, totp: inputs.totp });
                        await handleChangeLoginPassword({ api, newPassword: inputs.newPassword });

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
                    newPassword: c('Label').t`New mailbox password`,
                    confirmPassword: c('Label').t`Confirm mailbox password`,
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
                            isAdmin ? getOrganizationKeyRaw() : undefined,
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
                            organizationKey?.privateKey,
                            keyPassword,
                            keySalt
                        );

                        await api(updatePrivateKeyRoute(updateKeysPayload));

                        await mutatePassword(keyPassword);
                        await api(lockSensitiveSettings());
                        await call();

                        notifySuccess();
                        onClose?.();
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
                    isAdmin ? getOrganizationKeyRaw() : undefined,
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

                await handleUnlock({
                    api,
                    oldPassword: inputs.oldPassword,
                    totp: inputs.totp,
                });

                const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(
                    inputs.newPassword
                );

                const addressesWithKeys = await getAddressesWithKeysList(addresses);
                const updateKeysPayload = await getUpdateKeysPayload(
                    addressesWithKeys,
                    userKeysList,
                    organizationKey?.privateKey,
                    keyPassword,
                    keySalt
                );

                const routeConfig = updatePrivateKeyRoute(updateKeysPayload);

                if (mode === MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE) {
                    await api(routeConfig);
                } else {
                    await srpVerify({
                        api,
                        credentials: {
                            password: inputs.newPassword,
                            totp: inputs.totp,
                        },
                        config: routeConfig,
                    });
                }
                await mutatePassword(keyPassword);
                await api(lockSensitiveSettings());
                await call();

                notifySuccess();
                onClose?.();
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
                    oldPassword: isSubUser ? c('Label').t`Your password (admin)` : c('Label').t`Old login password`,
                    newPassword: c('Label').t`New password`,
                    confirmPassword: c('Label').t`Confirm password`,
                },
                description: (
                    <div className="mb1">
                        {c('Info')
                            .t`ProtonMail can also be used with a single password which replaces both the login and mailbox password. To switch to single password mode, enter the single password you would like to use and click Save.`}
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
                title: c('Title').t`Change mailbox password`,
                labels: {
                    oldPassword: isSubUser ? c('Label').t`Your password (admin)` : c('Label').t`Current login password`,
                    newPassword: c('Label').t`New mailbox password`,
                    confirmPassword: c('Label').t`Confirm mailbox password`,
                },
                onSubmit,
            };
        }

        throw new Error('Unknown mode');
    })();

    // translator: Make sure you remember the password to log in and decrypt emails. Proton can't help you recover any lost passwords. We recommend adding a recovery method first.
    const boldAlert = <b key="bold-alert">{c('Info').t`Proton can't help you recover any lost passwords.`}</b>;
    // translator: Make sure you remember the password to log in and decrypt emails. Proton can't help you recover any lost passwords. We recommend adding a recovery method first.
    const recoveryLink = (
        <SettingsLink key="recovery-link" path="/recovery">{c('Info').t`recovery method`}</SettingsLink>
    );
    const alert = (
        <>
            <Alert className="mb1" type="warning">
                {
                    // translator: Make sure you remember the password to log in and decrypt emails. Proton can't help you recover any lost passwords. We recommend adding a recovery method first.
                    c('Info')
                        .jt`Make sure you remember the password to log in and decrypt emails. ${boldAlert} We recommend adding a ${recoveryLink} first.`
                }
            </Alert>
        </>
    );

    const children = isLoadingAuth ? (
        <Loader />
    ) : (
        <>
            {description}
            {alert}
            {!isSecondPhase && (
                <InputFieldTwo
                    id="oldPassword"
                    label={labels.oldPassword}
                    placeholder={c('Placeholder').t`Password`}
                    autoComplete="current-password"
                    error={validator([requiredValidator(inputs.oldPassword), errors.loginError])}
                    as={PasswordInputTwo}
                    value={inputs.oldPassword}
                    onValue={(value: string) => {
                        setPartialInput({ oldPassword: value });
                        setPartialError({ loginError: '' });
                    }}
                    disabled={loading}
                    autoFocus
                />
            )}
            {!isSecondPhase && hasTOTPEnabled && (
                <InputFieldTwo
                    id="totp"
                    label={c('Label').t`Two-factor authentication code`}
                    value={inputs.totp}
                    placeholder={c('Placeholder').t`Two-factor authentication code`}
                    onValue={(value: string) => {
                        setPartialInput({ totp: value });
                        setPartialError({ loginError: '' });
                    }}
                    error={validator([requiredValidator(inputs.totp) && errors.loginError])}
                    disabled={loading}
                />
            )}

            <InputFieldTwo
                id="newPassword"
                label={labels.newPassword}
                placeholder={c('Placeholder').t`Password`}
                error={validator([requiredValidator(inputs.newPassword), passwordLengthValidator(inputs.newPassword)])}
                as={PasswordInputTwo}
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
        </>
    );

    if (errors.fatalError) {
        const handleFatalErrorClose = () => {
            if (errors.persistError) {
                // If there was an error with persisting the session, we have no choice but to logout
                authentication.logout();
            }
            onClose?.();
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
                        {submit || c('Action').t`Ok`}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const handleClose = loading || isLoadingAuth ? noop : onClose;

    return (
        <Modal as={Form} onClose={handleClose} {...rest} onSubmit={onSubmit}>
            <ModalHeader title={title} />
            <ModalContent>{children}</ModalContent>
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
