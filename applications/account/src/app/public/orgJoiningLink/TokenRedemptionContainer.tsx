import { type FC, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import type { PrivateKeyReference } from '@protontech/crypto';
import { c } from 'ttag';

import { parseJoiningLinkConfig } from '@proton/account/orgJoiningLink/helpers';
import { Button } from '@proton/atoms/Button/Button';
import {
    InputFieldTwo,
    PasswordInputTwo,
    Progress,
    TotpInput,
    useErrorHandler,
    useFormErrors,
    useNotifications,
} from '@proton/components';
import { PasswordPolicySpotlight, usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import PasswordStrengthIndicator from '@proton/components/components/passwordStrengthIndicator/PasswordStrengthIndicator';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import useLoading from '@proton/hooks/useLoading';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { redeemToken, verifyCode } from '@proton/shared/lib/api/authLoginLink';
import { getAuthAPI } from '@proton/shared/lib/api/helpers/customConfig';
import { getKeySalts, updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { getPasswordPolicies } from '@proton/shared/lib/api/passwordPolicies';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import {
    confirmPasswordValidator,
    emailValidator,
    numberValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import type {
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    KeySalt,
    PasswordPolicies,
    User,
} from '@proton/shared/lib/interfaces';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import { getDecryptedAddressKeysHelper } from '@proton/shared/lib/keys/getDecryptedAddressKeys';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { srpVerify } from '@proton/shared/lib/srp';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { computeKeyPassword } from '@proton/srp/lib/keys';

import type { LoginResult } from '../../content/actions/interface';
import Header from '../../public/Header';
import Layout from '../../public/Layout';
import Main from '../../public/Main';
import PasswordStrengthIndicatorSpotlight, {
    usePasswordStrengthIndicatorSpotlight,
} from '../../signup/PasswordStrengthIndicatorSpotlight';

import './TokenRedemptionContainer.scss';

type TokenRedemptionContainerView = 'email' | 'otp' | 'password';

const toApp = APPS.PROTONMAIL;
const steps: TokenRedemptionContainerView[] = ['email', 'otp', 'password'];
const totalSteps = steps.length;

const TokenRedemptionContainer: FC<{
    unauthenticatedApi: UnauthenticatedApi;
    onStartAuth: () => Promise<void>;
    onPreSubmit: () => Promise<void>;
    onLoginResult: (result: LoginResult) => void;
}> = ({ unauthenticatedApi, onStartAuth, onPreSubmit, onLoginResult }) => {
    const location = useLocation();
    const history = useHistory();
    const [submitting, withSubmitting] = useLoading();
    const [resending, withResending] = useLoading();

    const passwordStrengthIndicatorSpotlight = usePasswordStrengthIndicatorSpotlight();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit, reset } = useFormErrors();

    const [config, setConfig] = useState<{
        token: string;
        password: string;
        domain: string;
        orgName: string;
        username: string;
    }>();
    const [emailLocal, setEmailLocal] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const passwordContainerRef = useRef<HTMLInputElement>(null);
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [view, setView] = useState<TokenRedemptionContainerView>('email');
    const [passwordPolicies, setPasswordPolicies] = useState<PasswordPolicies>([]);
    const passwordPolicyValidation = usePasswordPolicyValidation(newPassword, passwordPolicies);
    const firstPolicyError = passwordPolicyValidation.result.find((result) => !result.valid)?.errorMessage || '';
    const errorHandler = useErrorHandler();

    const authRef = useRef<{
        api: Api;
        authResponse: AuthResponse;
        addressesKeys: { address: Address; keys: DecryptedAddressKey<PrivateKeyReference>[] }[];
        user: User;
        userKeys: DecryptedKey<PrivateKeyReference>[];
    }>();

    useEffect(() => {
        if (config) {
            return;
        }

        const fallbackHref = getAppHref(SSO_PATHS.APP_SWITCHER, APPS.PROTONACCOUNT);

        const parsedConfig = parseJoiningLinkConfig({ hash: location.hash });

        if (!parsedConfig) {
            createNotification({
                type: 'error',
                text: c('Error').t`Invalid joining link. Please contact your administrator.`,
            });
            return history.replace(fallbackHref);
        }

        history.replace({
            ...location,
            hash: '',
        });

        setConfig(parsedConfig);

        if (parsedConfig.username) {
            setEmailLocal(parsedConfig.username);
        }
    }, [config]);

    const viewConfig = useMemo<{ title: string; subTitle: ReactNode; button: string }>(() => {
        switch (view) {
            case 'email': {
                const orgName = config?.orgName ? <b key="org-name">{config.orgName}</b> : null;
                return {
                    title: c('Title').t`Activate your email`,
                    subTitle: orgName
                        ? c('Title')
                              .jt`Your admin at ${orgName} is inviting you to activate your new secure ${BRAND_NAME} account and update your password.`
                        : c('Title')
                              .jt`Your admin is inviting you to activate your new secure ${BRAND_NAME} account and update your password.`,
                    button: c('Action').t`Confirm email`,
                };
            }
            case 'otp': {
                return {
                    title: c('Title').t`Verify your email`,
                    subTitle: c('Title')
                        .t`We sent you a code to your email to make sure it’s you. This code is valid for 10 minutes. Please enter it below.`,
                    button: c('Action').t`Verify`,
                };
            }
            case 'password': {
                return {
                    title: c('Title').t`Create a new password`,
                    subTitle: '',
                    button: c('Action').t`Finish`,
                };
            }
        }
    }, [view, config]);

    useDocumentTitle(`${viewConfig.title} - ${BRAND_NAME}`);

    if (!config) {
        return null;
    }

    const { token, domain } = config;

    const email = !domain.length ? emailLocal : `${getEmailParts(emailLocal)[0]}@${domain}`;

    const disabled = submitting || resending;

    const handleRedeemToken = async ({ email, token }: { email: string; token: string }) => {
        await onPreSubmit?.();
        await onStartAuth?.();

        await unauthenticatedApi.apiCallback(redeemToken({ email, token }));

        setView('otp');
    };

    const handleVerifyOtp = async (code: string) => {
        const authResponse = await unauthenticatedApi.apiCallback<AuthResponse>(verifyCode({ code }));

        const api = getAuthAPI(authResponse.UID, authResponse.AccessToken, unauthenticatedApi.apiCallback);

        const [user, addresses, keySalts, passwordPolicies] = await Promise.all([
            getUser(api),
            getAllAddresses(api),
            api<{ KeySalts: KeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts),
            getPasswordPolicies({ api }),
        ]);

        if (!keySalts.length) {
            throw new Error('Missing key salts');
        }

        const keyPassword = await computeKeyPassword(config.password, keySalts[0].KeySalt);
        const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
        const addressesKeys = await Promise.all(
            addresses.map(async (address) => ({
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, user, userKeys, keyPassword),
            }))
        );

        authRef.current = {
            api,
            addressesKeys,
            authResponse,
            userKeys,
            user,
        };

        setPasswordPolicies(passwordPolicies);
        setView('password');
    };

    const handleChangePassword = async () => {
        const { api, user, addressesKeys, userKeys, authResponse } = authRef.current!;

        const { passphrase: newKeyPassword, salt: newKeySalt } = await generateKeySaltAndPassphrase(newPassword);

        const updateKeysPayload = await getUpdateKeysPayload({
            addressesKeys,
            userKeys,
            // Joining member do not have access to the org key
            organizationKey: undefined,
            keyPassword: newKeyPassword,
            keySalt: newKeySalt,
        });

        await srpVerify({
            api,
            credentials: { password: newPassword },
            config: updatePrivateKeyRoute(updateKeysPayload),
        });

        await persistSession({
            ...authResponse,
            clearKeyPassword: newPassword,
            keyPassword: newKeyPassword,
            User: user,
            api,
            persistent: false,
            trusted: false,
            source: SessionSource.Proton,
        });

        onLoginResult({
            type: 'done',
            payload: {
                url: new URL(getAppHref('/', toApp, authResponse.LocalID)),
            },
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (submitting || !onFormSubmit()) {
            return;
        }

        reset();

        const handler = (() => {
            switch (view) {
                case 'email':
                    return () => handleRedeemToken({ token, email }).catch(errorHandler);
                case 'otp':
                    return () => handleVerifyOtp(otp).catch(errorHandler);
                case 'password':
                    return () => handleChangePassword().catch(errorHandler);
            }
        })();

        return withSubmitting(handler());
    };

    const handleResend = async () => {
        try {
            await withResending(handleRedeemToken({ email, token }));

            createNotification({
                text: c('Info').t`Code has been re-sent.`,
                type: 'success',
                showCloseButton: false,
            });
        } catch (err) {
            errorHandler(err);
        }
    };

    const handleBack = () => {
        setOtp('');
        setView('email');
    };

    const step = steps.indexOf(view) + 1;

    return (
        <Layout hasDecoration toApp={toApp} layoutClassName="token-redemption-container">
            <Main className="flex flex-column">
                <Header title={viewConfig.title} subTitle={viewConfig.subTitle} />
                <form onSubmit={handleSubmit} className="flex flex-column items-start w-full grow">
                    {view === 'email' && (
                        <InputFieldTwo
                            autoFocus
                            name="email"
                            label={c('Label').t`Email address`}
                            placeholder={c('Signup label').t`Your email`}
                            value={emailLocal}
                            onChange={({ target: { value } }) => setEmailLocal(value)}
                            disableChange={disabled}
                            suffix={domain && <span className="color-hint">@{domain}</span>}
                            bigger
                            error={validator([requiredValidator(emailLocal), emailValidator(email)])}
                        />
                    )}
                    {view === 'otp' && (
                        <>
                            <div className="w-full">
                                <InputFieldTwo
                                    id="totp"
                                    as={TotpInput}
                                    key="totp"
                                    length={6}
                                    disableChange={submitting || resending}
                                    autoFocus
                                    autoComplete="one-time-code"
                                    value={otp}
                                    onValue={setOtp}
                                    bigger
                                    error={validator([
                                        requiredValidator(otp),
                                        numberValidator(otp),
                                        otp.length !== 6 ? c('Error').t`Enter 6 digits` : '',
                                    ])}
                                />
                            </div>
                            <Button
                                onClick={handleResend}
                                color="norm"
                                type="button"
                                shape="underline"
                                loading={resending}
                                className="m-0"
                            >{c('Action').t`Resend code`}</Button>
                        </>
                    )}
                    {view === 'password' && (
                        <>
                            <p className="color-norm bg-weak p-4 rounded-lg w-full mt-0 mb-6 user-select">{email}</p>
                            {((input) =>
                                passwordPolicyValidation.enabled ? (
                                    <PasswordPolicySpotlight
                                        wrapper={passwordPolicyValidation}
                                        anchorRef={passwordContainerRef}
                                        enabled={passwordPolicyValidation.enabled}
                                        validationResults={passwordPolicyValidation.result}
                                        password={newPassword}
                                        isAboveModal={false}
                                    >
                                        {input}
                                    </PasswordPolicySpotlight>
                                ) : (
                                    <PasswordStrengthIndicatorSpotlight
                                        wrapper={passwordStrengthIndicatorSpotlight}
                                        password={newPassword}
                                        anchorRef={passwordContainerRef}
                                    >
                                        {input}
                                    </PasswordStrengthIndicatorSpotlight>
                                ))(
                                <InputFieldTwo
                                    as={PasswordInputTwo}
                                    autoComplete="new-password"
                                    autoFocus
                                    name="new-password"
                                    placeholder={c('Label').t`New password`}
                                    value={newPassword}
                                    onChange={({ target: { value } }) => setNewPassword(value)}
                                    disableChange={disabled}
                                    bigger
                                    className={newPassword.length ? '' : 'mb-6'}
                                    assistContainerClassName="assist-container--no-min-height"
                                    containerRef={passwordContainerRef}
                                    error={validator([
                                        requiredValidator(newPassword),
                                        passwordPolicyValidation.enabled
                                            ? firstPolicyError
                                            : passwordLengthValidator(newPassword),
                                    ])}
                                    onFocus={
                                        passwordPolicyValidation.enabled
                                            ? passwordPolicyValidation.handlers.onInputFocus
                                            : passwordStrengthIndicatorSpotlight.onInputFocus
                                    }
                                    onBlur={
                                        passwordPolicyValidation.enabled
                                            ? passwordPolicyValidation.handlers.onInputBlur
                                            : passwordStrengthIndicatorSpotlight.onInputBlur
                                    }
                                />
                            )}
                            {!passwordPolicyValidation.enabled &&
                                passwordStrengthIndicatorSpotlight.spotlight &&
                                passwordStrengthIndicatorSpotlight.supported && (
                                    <PasswordStrengthIndicator
                                        password={newPassword}
                                        className="pb-4"
                                        service={passwordStrengthIndicatorSpotlight.service}
                                    />
                                )}
                            <InputFieldTwo
                                as={PasswordInputTwo}
                                autoComplete="new-password"
                                name="confirm-new-password"
                                rootClassName="mb-4"
                                placeholder={c('Label').t`New password`}
                                value={confirmNewPassword}
                                onChange={({ target: { value } }) => setConfirmNewPassword(value)}
                                disableChange={disabled}
                                bigger
                                error={validator([
                                    requiredValidator(confirmNewPassword),
                                    confirmPasswordValidator(confirmNewPassword, newPassword),
                                ])}
                            />
                        </>
                    )}
                    <div className="flex-1"></div>
                    <div className="w-full">
                        <Progress className="progress-bar--norm mb-4 w-full" value={step} max={steps.length} />
                    </div>
                    <div className="w-full flex gap-2 items-center">
                        <p className="m-0 color-hint flex-1">
                            {
                                // translator: Step <current step>/<total number of steps>
                                c('Info').t`Step ${step}/${totalSteps}`
                            }
                        </p>
                        {view === 'otp' && (
                            <Button size="large" color="weak" type="button" onClick={handleBack}>
                                {c('Action').t`Back`}
                            </Button>
                        )}
                        <Button size="large" color="norm" type="submit" loading={submitting}>
                            {submitting ? c('Info').t`Loading` : viewConfig.button}
                        </Button>
                    </div>
                </form>
            </Main>
        </Layout>
    );
};

export default TokenRedemptionContainer;
