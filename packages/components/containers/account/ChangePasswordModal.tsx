import React, { useState, useEffect, ChangeEvent } from 'react';
import { c } from 'ttag';
import { lockSensitiveSettings } from 'proton-shared/lib/api/user';
import { InfoAuthedResponse, TwoFaResponse } from 'proton-shared/lib/authentication/interface';
import { getInfo, PASSWORD_WRONG_ERROR } from 'proton-shared/lib/api/auth';
import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys';
import { isSSOMode } from 'proton-shared/lib/constants';
import { persistSessionWithPassword } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { PASSWORD_CHANGE_MESSAGE_TYPE, sendMessageToTabs } from 'proton-shared/lib/helpers/crossTab';
import { getHasTOTPEnabled, getHasTOTPSettingEnabled } from 'proton-shared/lib/settings/twoFactor';
import { updatePrivateKeyRoute } from 'proton-shared/lib/api/keys';
import { srpVerify } from 'proton-shared/lib/srp';
import { Address } from 'proton-shared/lib/interfaces';
import { getUpdateKeysPayload } from 'proton-shared/lib/keys/changePassword';
import { confirmPasswordValidator, passwordLengthValidator } from 'proton-shared/lib/helpers/formValidators';

import { handleUnlock, handleChangeLoginPassword } from './changePasswordHelper';
import { Alert, PasswordInput, TwoFactorInput, Row, Label, Field, FormModal, Loader } from '../../components';

import { GenericError } from '../error';
import {
    useAuthentication,
    useEventManager,
    useNotifications,
    useApi,
    useUser,
    useUserSettings,
    useGetUserKeys,
    useGetOrganizationKeyRaw,
    useBeforeUnload,
    useGetAddresses,
    useGetAddressKeys,
} from '../../hooks';

export enum MODES {
    CHANGE_ONE_PASSWORD_MODE = 1,
    CHANGE_TWO_PASSWORD_MAILBOX_MODE = 2,
    CHANGE_TWO_PASSWORD_LOGIN_MODE = 3,
    SWITCH_ONE_PASSWORD = 4,
    SWITCH_TWO_PASSWORD = 5,
}

interface Props {
    onClose?: () => void;
    mode: MODES;
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

const DEFAULT_ERRORS = {
    loginError: '',
    fatalError: false,
};

const ChangePasswordModal = ({ onClose, mode, ...rest }: Props) => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const getOrganizationKeyRaw = useGetOrganizationKeyRaw();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();

    const [User] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const { isSubUser, isAdmin, Name, Email } = User;
    const [adminAuthTwoFA, setAdminAuthTwoFA] = useState<TwoFaResponse>();

    const [inputs, setInputs] = useState<Inputs>({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        totp: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Errors>(DEFAULT_ERRORS);
    const [isSecondPhase, setSecondPhase] = useState<boolean>(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useBeforeUnload(loading ? c('Info').t`By leaving now, changes may not be saved` : '');

    const setPartialError = (object: Partial<Errors>) => setErrors((oldState) => ({ ...oldState, ...object }));
    const setPartialInput = (object: Partial<Inputs>) => setInputs((oldState) => ({ ...oldState, ...object }));
    const resetErrors = () => setErrors(DEFAULT_ERRORS);

    useEffect(() => {
        if (!isSubUser) {
            return;
        }
        const run = async () => {
            try {
                /**
                 * There is a special case for admins logged into non-private users. User settings returns two factor
                 * information for the non-private user, and not for the admin to which the session actually belongs.
                 * So we query auth info to get the information about the admin.
                 */
                const infoResult = await api<InfoAuthedResponse>(getInfo());
                setAdminAuthTwoFA(infoResult['2FA']);
            } catch (e) {
                setPartialError({ fatalError: true });
            }
        };
        run();
    }, []);

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
            });
            sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, { localID, status: true });
        } catch (e) {
            sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, { localID, status: false });
            // If persisting the password fails for some reason.
            setPartialError({ fatalError: true, persistError: true });
            throw e;
        }
    };

    const getModalProperties = (mode: MODES) => {
        if ([MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE, MODES.CHANGE_ONE_PASSWORD_MODE].includes(mode)) {
            if (isSubUser) {
                return {
                    title: c('Title').t`Change password for ${Name} (${Email})`,
                    extraAlert: (
                        <Alert>
                            {c('Info').t`Enter your own password (as organization admin) and this user's new password.`}
                        </Alert>
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

    const { labels, extraAlert, ...modalProps } = (() => {
        if (mode === MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE) {
            return {
                ...getModalProperties(mode),
                async onSubmit() {
                    try {
                        setIsSubmitted(true);
                        validateNewPasswords();
                        resetErrors();
                        setLoading(true);

                        await handleUnlock({ api, oldPassword: inputs.oldPassword, totp: inputs.totp });
                        await handleChangeLoginPassword({ api, newPassword: inputs.newPassword });
                        await api(lockSensitiveSettings());

                        notifySuccess();
                        onClose?.();
                    } catch (e) {
                        setLoading(false);
                        checkLoginError(e);
                    }
                },
            };
        }

        if (mode === MODES.SWITCH_TWO_PASSWORD && !isSecondPhase) {
            return {
                title: c('Title').t`Switch to two-password mode`,
                extraAlert: (
                    <Alert>
                        {c('Info')
                            .t`Two-password mode uses separate passwords for login and mailbox decryption. This provides a minor security benefit in some situations, however we recommend one-password mode for most users. To switch to two password mode, first set a login password and then set a mailbox password.`}
                    </Alert>
                ),
                labels: {
                    oldPassword: isSubUser ? c('Label').t`Your password (admin)` : c('Label').t`Old password`,
                    newPassword: c('Label').t`New login password`,
                    confirmPassword: c('Label').t`Confirm login password`,
                },
                async onSubmit() {
                    try {
                        setIsSubmitted(true);
                        validateNewPasswords();
                        resetErrors();
                        setLoading(true);

                        await handleUnlock({ api, oldPassword: inputs.oldPassword, totp: inputs.totp });
                        await handleChangeLoginPassword({ api, newPassword: inputs.newPassword });

                        setSecondPhase(true);
                        setIsSubmitted(false);
                        setInputs({
                            newPassword: '',
                            confirmPassword: '',
                            totp: '',
                            oldPassword: '',
                        });
                        setLoading(false);
                    } catch (e) {
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
                    try {
                        // Stop the event manager to prevent race conditions
                        stop();

                        const [addresses, userKeysList, organizationKey] = await Promise.all([
                            getAddresses(),
                            getUserKeys(),
                            isAdmin ? getOrganizationKeyRaw() : undefined,
                        ]);

                        setIsSubmitted(true);
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
                    } catch (e) {
                        setLoading(false);
                        checkFatalError(e);
                    } finally {
                        start();
                    }
                },
            };
        }

        const onSubmit = async () => {
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
                    return createNotification({
                        type: 'error',
                        text: c('Error').t`Please generate keys before you try to change your password.`,
                    });
                }
                setIsSubmitted(true);
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
            } catch (e) {
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
                extraAlert: (
                    <Alert>
                        {c('Info')
                            .t`ProtonMail can also be used with a single password which replaces both the login and mailbox password. To switch to single password mode, enter the single password you would like to use and click Save.`}
                    </Alert>
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
                    oldPassword: isSubUser ? c('Label').t`Your password (admin)` : c('Label').t`Old login password`,
                    newPassword: c('Label').t`New mailbox password`,
                    confirmPassword: c('Label').t`Confirm mailbox password`,
                },
                onSubmit,
            };
        }

        throw new Error('Unknown mode');
    })();

    const isLoading = loadingUserSettings || (isSubUser && !adminAuthTwoFA);

    const boldAlert = <b key="bold-alert">{c('Info').t`Proton can't help you recover any lost passwords`}</b>;
    const alert = (
        <>
            <Alert type="warning">
                {c('Info')
                    .jt`Make sure you remember the password to log in and decrypt emails. ${boldAlert}. We recommend adding a recovery email first.`}
            </Alert>
        </>
    );

    const hasTOTPEnabled = isSubUser
        ? getHasTOTPEnabled(adminAuthTwoFA?.Enabled)
        : getHasTOTPSettingEnabled(userSettings);

    const children = isLoading ? (
        <Loader />
    ) : (
        <>
            {extraAlert}
            {alert}
            {!isSecondPhase && (
                <Row>
                    <Label htmlFor="oldPassword">{labels.oldPassword}</Label>
                    <Field>
                        <PasswordInput
                            id="oldPassword"
                            value={inputs.oldPassword}
                            onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
                                setPartialInput({ oldPassword: value });
                                setPartialError({ loginError: '' });
                            }}
                            error={errors.loginError}
                            placeholder={c('Placeholder').t`Password`}
                            autoComplete="current-password"
                            required
                        />
                    </Field>
                </Row>
            )}
            {!isSecondPhase && hasTOTPEnabled && (
                <Row>
                    <Label htmlFor="totp">{c('Label').t`Two-factor authentication code`}</Label>
                    <Field>
                        <TwoFactorInput
                            id="totp"
                            value={inputs.totp}
                            onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
                                setPartialInput({ totp: value });
                                setPartialError({ loginError: '' });
                            }}
                            error={errors.loginError}
                            placeholder={c('Placeholder').t`Two-factor authentication code`}
                            required
                        />
                    </Field>
                </Row>
            )}
            <Row>
                <Label htmlFor="newPassword">{labels.newPassword}</Label>
                <Field>
                    <PasswordInput
                        id="newPassword"
                        key={`${isSecondPhase}${labels.newPassword}`}
                        value={inputs.newPassword}
                        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                            setPartialInput({ newPassword: value })
                        }
                        isSubmitted={isSubmitted}
                        error={newPasswordError}
                        placeholder={c('Placeholder').t`Password`}
                        autoComplete="new-password"
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="confirmPassword">{labels.confirmPassword}</Label>
                <Field>
                    <PasswordInput
                        id="confirmPassword"
                        key={`${isSecondPhase}${labels.confirmPassword}`}
                        value={inputs.confirmPassword}
                        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                            setPartialInput({ confirmPassword: value })
                        }
                        isSubmitted={isSubmitted}
                        error={confirmPasswordError}
                        placeholder={c('Placeholder').t`Confirm`}
                        autoComplete="new-password"
                        required
                    />
                </Field>
            </Row>
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
            <FormModal
                close={c('Action').t`Close`}
                submit={c('Action').t`Ok`}
                onClose={handleFatalErrorClose}
                {...modalProps}
                onSubmit={handleFatalErrorClose}
                {...rest}
            >
                <GenericError />
            </FormModal>
        );
    }

    return (
        <FormModal
            close={c('Action').t`Close`}
            submit={c('Action').t`Save`}
            loading={loading || isLoading}
            onClose={onClose}
            hasClose={false}
            {...modalProps}
            {...rest}
        >
            {children}
        </FormModal>
    );
};

export default ChangePasswordModal;
