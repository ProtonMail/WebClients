import React, { useState, useEffect, ChangeEvent } from 'react';
import { c } from 'ttag';
import {
    Alert,
    GenericError,
    PasswordInput,
    TwoFactorInput,
    Row,
    Label,
    Field,
    Icon,
    FormModal,
    Loader,
    useAuthentication,
    useEventManager,
    useUser,
    useUserSettings,
    useNotifications,
    useGetUserKeys,
    useGetAddressesKeys,
    useGetOrganizationKeyRaw,
    useApi
} from '../../index';
import { lockSensitiveSettings } from 'proton-shared/lib/api/user';
import { AuthInfo, Auth2FA } from 'proton-shared/lib/interfaces/Auth';
import { getInfo, PASSWORD_WRONG_ERROR } from 'proton-shared/lib/api/auth';
import {
    handleUnlock,
    handleChangeMailboxPassword,
    handleChangeLoginPassword,
    handleChangeOnePassword,
    getArmoredPrivateKeys
} from './changePasswordHelper';
import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { TWO_FA_FLAGS } from 'proton-shared/lib/constants';

export enum MODES {
    CHANGE_ONE_PASSWORD_MODE = 1,
    CHANGE_TWO_PASSWORD_MAILBOX_MODE = 2,
    CHANGE_TWO_PASSWORD_LOGIN_MODE = 3,
    SWITCH_ONE_PASSWORD = 4,
    SWITCH_TWO_PASSWORD = 5
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
    confirmPasswordError: string;
    fatalError: boolean;
}

const DEFAULT_ERRORS = {
    loginError: '',
    confirmPasswordError: '',
    fatalError: false
};

const ChangePasswordModal = ({ onClose, mode, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const getOrganizationKey = useGetOrganizationKeyRaw();
    const getUserKeys = useGetUserKeys();
    const getAddressesKeys = useGetAddressesKeys();

    const [User] = useUser();
    const [{ '2FA': userAuth2FA }, loadingUserSettings] = useUserSettings();

    const { isSubUser, isAdmin } = User;
    const [adminAuthTwoFA, setAdminAuthTwoFA] = useState<Auth2FA>();

    useEffect(() => {
        if (!isSubUser) {
            return;
        }
        (async () => {
            const infoResult = await api<AuthInfo>(getInfo());
            /**
             * There is a special case for admins logged into non-private users. User settings returns two factor
             * information for the non-private user, and not for the admin to which the session actually belongs.
             * So we query auth info to get the information about the admin.
             */
            setAdminAuthTwoFA(infoResult['2FA']);
        })();
    }, []);

    const [inputs, setInputs] = useState<Inputs>({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        totp: ''
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Errors>(DEFAULT_ERRORS);
    const [isSecondPhase, setSecondPhase] = useState<boolean>(false);

    const setPartialError = (object: Partial<Errors>) => setErrors((oldState) => ({ ...oldState, ...object }));
    const setPartialInput = (object: Partial<Inputs>) => setInputs((oldState) => ({ ...oldState, ...object }));
    const resetErrors = () => setErrors(DEFAULT_ERRORS);

    const validateConfirmPassword = () => {
        if (inputs.confirmPassword !== inputs.newPassword) {
            setPartialError({
                ...DEFAULT_ERRORS,
                confirmPasswordError: c('Error').t`Passwords do not match`
            });
            throw new Error('PasswordMatch');
        }
    };

    const checkLoginError = ({ data: { Code, Error } = { Code: 0, Error: '' } }) => {
        if (Code === PASSWORD_WRONG_ERROR) {
            setPartialError({
                ...DEFAULT_ERRORS,
                loginError: Error
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

    const { labels, extraAlert, ...modalProps } = (() => {
        if (mode === MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE) {
            return {
                title: c('Title').t`Change login password`,
                labels: {
                    oldPassword: c('Label').t`Old login password`,
                    newPassword: c('Label').t`New login password`,
                    confirmPassword: c('Label').t`Confirm login password`
                },
                async onSubmit() {
                    try {
                        validateConfirmPassword();
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
                }
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
                    oldPassword: c('Label').t`Old password`,
                    newPassword: c('Label').t`New login password`,
                    confirmPassword: c('Label').t`Confirm login password`
                },
                async onSubmit() {
                    try {
                        validateConfirmPassword();
                        resetErrors();
                        setLoading(true);

                        await handleUnlock({ api, oldPassword: inputs.oldPassword, totp: inputs.totp });
                        await handleChangeLoginPassword({ api, newPassword: inputs.newPassword });

                        setSecondPhase(true);
                        setInputs({
                            newPassword: '',
                            confirmPassword: '',
                            totp: '',
                            oldPassword: ''
                        });
                        setLoading(false);
                    } catch (e) {
                        setLoading(false);
                        checkLoginError(e);
                    }
                }
            };
        }

        if (mode === MODES.SWITCH_TWO_PASSWORD && isSecondPhase) {
            return {
                title: c('Title').t`Switch to two-password mode`,
                labels: {
                    newPassword: c('Label').t`New mailbox password`,
                    confirmPassword: c('Label').t`Confirm mailbox password`
                },
                async onSubmit() {
                    try {
                        const [userKeysList, addressesKeysMap, organizationKey] = await Promise.all([
                            getUserKeys(),
                            getAddressesKeys(),
                            isAdmin ? getOrganizationKey() : undefined
                        ]);

                        validateConfirmPassword();
                        resetErrors();
                        setLoading(true);

                        const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(
                            inputs.newPassword
                        );
                        const { armoredOrganizationKey, armoredKeys } = await getArmoredPrivateKeys({
                            userKeysList,
                            addressesKeysMap,
                            organizationKey: organizationKey?.privateKey,
                            keyPassword
                        });
                        await handleChangeMailboxPassword({ api, keySalt, armoredOrganizationKey, armoredKeys });
                        authentication.setPassword(keyPassword);
                        await api(lockSensitiveSettings());
                        await call();

                        notifySuccess();
                        onClose?.();
                    } catch (e) {
                        setLoading(false);
                        checkFatalError(e);
                    }
                }
            };
        }

        const onSubmit = async () => {
            try {
                const [userKeysList, addressesKeysMap, organizationKey] = await Promise.all([
                    getUserKeys(),
                    getAddressesKeys(),
                    isAdmin ? getOrganizationKey() : undefined
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
                        text: c('Error').t`Please generate keys before you try to change your password.`
                    });
                }
                validateConfirmPassword();
                resetErrors();
                setLoading(true);

                const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(
                    inputs.newPassword
                );
                const { armoredOrganizationKey, armoredKeys } = await getArmoredPrivateKeys({
                    userKeysList,
                    addressesKeysMap,
                    organizationKey: organizationKey?.privateKey,
                    keyPassword
                });

                await handleUnlock({
                    api,
                    oldPassword: inputs.oldPassword,
                    totp: inputs.totp
                });

                if (mode === MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE) {
                    await handleChangeMailboxPassword({ api, armoredKeys, armoredOrganizationKey, keySalt });
                } else {
                    await handleChangeOnePassword({
                        api,
                        armoredKeys,
                        armoredOrganizationKey,
                        keySalt,
                        newPassword: inputs.newPassword,
                        totp: inputs.totp
                    });
                }
                authentication.setPassword(keyPassword);
                await api(lockSensitiveSettings());
                await call();

                notifySuccess();
                onClose?.();
            } catch (e) {
                setLoading(false);
                checkFatalError(e);
                checkLoginError(e);
            }
        };

        if (mode === MODES.SWITCH_ONE_PASSWORD) {
            return {
                title: c('Title').t`Switch to one-password mode`,
                labels: {
                    oldPassword: c('Label').t`Old login password`,
                    newPassword: c('Label').t`New password`,
                    confirmPassword: c('Label').t`Confirm password`
                },
                extraAlert: (
                    <Alert>
                        {c('Info')
                            .t`ProtonMail can also be used with a single password which replaces both the login and mailbox password. To switch to single password mode, enter the single password you would like to use and click Save.`}
                    </Alert>
                ),
                onSubmit
            };
        }

        if (mode === MODES.CHANGE_ONE_PASSWORD_MODE) {
            return {
                title: c('Title').t`Change password`,
                labels: {
                    oldPassword: c('Label').t`Old password`,
                    newPassword: c('Label').t`New password`,
                    confirmPassword: c('Label').t`Confirm password`
                },
                onSubmit
            };
        }

        if (mode === MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE) {
            return {
                title: c('Title').t`Change mailbox password`,
                labels: {
                    oldPassword: c('Label').t`Old login password`,
                    newPassword: c('Label').t`New mailbox password`,
                    confirmPassword: c('Label').t`Confirm mailbox password`
                },
                onSubmit
            };
        }

        throw new Error('Unknown mode');
    })();

    const isLoading = loadingUserSettings || (isSubUser && !adminAuthTwoFA);

    const eye = <Icon key="0" name="read" />;
    const alert = (
        <>
            <Alert type="warning">
                {c('Info')
                    .t`Do NOT forget this password. If you forget it, you will not be able to login or decrypt your messages.`}
                <br />
                <br />
                {c('Info')
                    .jt`Save your password somewhere safe. Click on the ${eye} icon to confirm you that have typed your password correctly.`}
                <br />
                <br />
                {c('Info')
                    .t`We recommend adding a recovery email address first. Otherwise, you cannot recover your account if something goes wrong.`}
            </Alert>
        </>
    );

    const twoFAEnabledFlag = isSubUser ? adminAuthTwoFA?.Enabled : userAuth2FA?.Enabled;
    const hasTotp = hasBit(twoFAEnabledFlag, TWO_FA_FLAGS.TOTP);

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
                            onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                                setPartialInput({ oldPassword: value })
                            }
                            error={errors.loginError}
                            placeholder={c('Placeholder').t`Password`}
                            autoComplete="current-password"
                            required
                        />
                    </Field>
                </Row>
            )}
            {!isSecondPhase && hasTotp && (
                <Row>
                    <Label htmlFor="totp">{c('Label').t`Two-factor code`}</Label>
                    <Field>
                        <TwoFactorInput
                            id="totp"
                            value={inputs.totp}
                            onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                                setPartialInput({ totp: value })
                            }
                            error={errors.loginError}
                            placeholder={c('Placeholder').t`Two-factor code`}
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
                        error={errors.confirmPasswordError}
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
                        error={errors.confirmPasswordError}
                        placeholder={c('Placeholder').t`Confirm`}
                        autoComplete="new-password"
                        required
                    />
                </Field>
            </Row>
        </>
    );

    if (errors.fatalError) {
        return (
            <FormModal
                close={c('Action').t`Close`}
                submit={c('Action').t`Ok`}
                onClose={onClose}
                {...modalProps}
                onSubmit={onClose}
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
            {...modalProps}
            {...rest}
        >
            {children}
        </FormModal>
    );
};

export default ChangePasswordModal;
