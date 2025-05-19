import type { MutableRefObject } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button, Href, InlineLinkButton } from '@proton/atoms';
import type { ChallengeRef, ChallengeResult } from '@proton/components';
import {
    Challenge,
    Checkbox,
    Icon,
    InputFieldTwo,
    Label,
    PasswordInputTwo,
    useErrorHandler,
    useFormErrors,
    useLocalState,
    useNotifications,
} from '@proton/components';
import { AuthType, type AuthTypeData, ExternalSSOFlow } from '@proton/components/containers/login/interface';
import { handleLogin } from '@proton/components/containers/login/loginActions';
import { ExternalSSOError, handleExternalSSOLogin } from '@proton/components/containers/login/ssoExternalLogin';
import { useLoading } from '@proton/hooks';
import { auth, getInfo } from '@proton/shared/lib/api/auth';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import type {
    AuthResponse,
    AuthVersion,
    InfoResponse,
    SSOInfoResponse,
} from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Api, Unwrap } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { Paths } from '../content/helper';
import SupportDropdown from '../public/SupportDropdown';
import { defaultPersistentKey } from '../public/helper';
import SignupButton from './SignupButton';

export interface LoginFormRef {
    getIsLoading: () => boolean;
    reset: () => void;
}

interface Props {
    modal?: boolean;
    api: Api;
    onSubmit: (data: {
        authType: AuthType;
        authResponse: AuthResponse;
        authVersion: AuthVersion;
        uid: string | undefined;
        username: string;
        password: string;
        persistent: boolean;
        payload: ChallengeResult;
        path?: string;
    }) => Promise<void>;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    signInText?: string;
    externalSSO: {
        enabled?: boolean;
        options?: {
            token?: string;
            flow?: ExternalSSOFlow;
        };
    };
    defaultUsername?: string;
    hasRemember?: boolean;
    paths: Paths;
    toApp?: APP_NAMES;
    productParam?: ProductParam;
    authTypeData: AuthTypeData;
    onChangeAuthTypeData: (authTypeData: AuthTypeData) => void;
    loginFormRef: MutableRefObject<LoginFormRef | undefined>;
    appName: APP_NAMES;
    externalRedirect?: string;
    usernameReadOnly?: boolean;
}

const handleVpnToAccountSSORedirect = ({
    externalRedirect,
    productParam,
    username,
}: {
    externalRedirect?: string;
    productParam?: ProductParam;
    username: string;
}) => {
    const url = new URL('https://account.proton.me/sso/login');
    url.searchParams.set('username', username);
    url.searchParams.set('flow', 'redirect');
    if (externalRedirect && externalRedirect !== '/') {
        url.searchParams.set('continueTo', externalRedirect);
    }
    const normalizedProductParam = normalizeProduct(productParam);
    if (normalizedProductParam) {
        url.searchParams.set('product', normalizedProductParam);
    }
    window.location.assign(url.toString());
};

const LoginForm = ({
    api,
    appName,
    modal,
    authTypeData,
    onChangeAuthTypeData,
    onSubmit,
    onPreSubmit,
    onStartAuth,
    defaultUsername = '',
    signInText = c('Action').t`Sign in`,
    hasRemember,
    productParam,
    externalSSO,
    paths,
    loginFormRef,
    externalRedirect,
    usernameReadOnly,
}: Props) => {
    const handleError = useErrorHandler();
    const [submitting, withSubmitting] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [maybePersistent, setPersistent] = useLocalState(false, defaultPersistentKey);
    const persistent = isElectronApp ? true : maybePersistent;
    const { createNotification } = useNotifications();

    const usernameRef = useRef<HTMLInputElement>(null);
    const challengeRefLogin = useRef<ChallengeRef>();
    const [externalSSOState, setExternalSSOState] = useState<
        | {
              challengeResult: ChallengeResult;
              abortController: AbortController;
              ssoInfoResponse: SSOInfoResponse;
          }
        | undefined
    >(undefined);
    const onceRef = useRef(false);

    const { validator, onFormSubmit, reset } = useFormErrors();

    useImperativeHandle(loginFormRef, () => ({
        getIsLoading: () => {
            return Boolean(submitting || externalSSOState);
        },
        reset: () => {
            reset();
            setPassword('');
        },
    }));

    const keepMeSignedInLearnMoreLink = (
        <Href
            className="color-inherit inline-block link-focus"
            key="learn-more"
            href={getKnowledgeBaseUrl('/keep-me-signed-in')}
        >
            {c('Info').t`Why?`}
        </Href>
    );

    const signUp = paths.signup ? <SignupButton paths={paths} key="signup" /> : undefined;

    const updateErrorMessage = (error: any) => {
        setErrorMsg(getApiErrorMessage(error) || c('Error').t`Unknown error`);
    };

    const handleSubmitExternalSSOToken = async ({
        uid,
        token,
        payload,
    }: {
        uid: string | undefined;
        token: string;
        payload: ChallengeResult | undefined;
    }) => {
        let authResponse: AuthResponse;
        try {
            const config = auth({ SSOResponseToken: token }, persistent);
            authResponse = await api<AuthResponse>(uid ? withUIDHeaders(uid, config) : config);
        } catch (e) {
            throw e;
        }

        return onSubmit({
            authType: AuthType.ExternalSSO,
            authVersion: 4 as const,
            authResponse,
            uid,
            username,
            password: '',
            payload,
            persistent,
        });
    };

    const handleSubmitExternalSSO = async (maybeSSOInfoResponse?: SSOInfoResponse) => {
        setExternalSSOState(undefined);

        let ssoInfoResponse: SSOInfoResponse | undefined = maybeSSOInfoResponse;
        if (!ssoInfoResponse) {
            try {
                await onPreSubmit?.();
                await onStartAuth();
                ssoInfoResponse = await api<SSOInfoResponse>(getInfo({ username, intent: 'SSO' }));
            } catch (e) {
                const { code } = getApiError(e);
                if (code === API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SRP) {
                    onChangeAuthTypeData({ type: AuthType.Srp });
                    handleError(e);
                    setPassword('');
                    return;
                }
                throw e;
            }
        }

        const challengeResult = await challengeRefLogin.current?.getChallenge().catch(noop);

        const abortController = new AbortController();
        setExternalSSOState({ challengeResult, abortController, ssoInfoResponse });
        let externalSSOResult: Unwrap<ReturnType<typeof handleExternalSSOLogin>>;

        try {
            externalSSOResult = await handleExternalSSOLogin({
                signal: abortController.signal,
                token: ssoInfoResponse.SSOChallengeToken,
            });
        } catch (e) {
            if (e instanceof ExternalSSOError) {
                return;
            }
            throw e;
        } finally {
            setExternalSSOState(undefined);
        }

        return handleSubmitExternalSSOToken({
            uid: externalSSOResult.uid,
            token: externalSSOResult.token,
            payload: challengeResult,
        });
    };

    const handleSubmitAuto = async () => {
        setExternalSSOState(undefined);
        setPassword('');
        onChangeAuthTypeData({ type: AuthType.Auto });

        let ssoInfoResponse: SSOInfoResponse | InfoResponse | undefined;
        try {
            await onPreSubmit?.();
            await onStartAuth();
            ssoInfoResponse = await api<SSOInfoResponse | InfoResponse>(getInfo({ username, intent: 'Auto' }));
        } catch (e) {
            const { code } = getApiError(e);
            if (code === API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO) {
                if (appName !== APPS.PROTONACCOUNT) {
                    handleVpnToAccountSSORedirect({ externalRedirect, productParam, username });
                    return;
                }
                await handleSubmitExternalSSO();
                return;
            }
            throw e;
        }

        if (ssoInfoResponse && 'SSOChallengeToken' in ssoInfoResponse) {
            return handleSubmitExternalSSO(ssoInfoResponse);
        }

        if (ssoInfoResponse && 'Modulus' in ssoInfoResponse) {
            reset();
            onChangeAuthTypeData({ type: AuthType.AutoSrp, info: ssoInfoResponse, username });
            return;
        }

        throw new Error('Invalid response from server');
    };

    const triggerSSOLoginNotification = () => {
        createNotification({
            type: 'info',
            text: c('Info')
                .t`Your organization uses single sign-on (SSO). Press Sign in to continue with your SSO provider.`,
        });
    };

    const handleSubmitSrp = async () => {
        const payload = await challengeRefLogin.current?.getChallenge().catch(noop);

        let result: Unwrap<ReturnType<typeof handleLogin>>;

        try {
            await onPreSubmit?.();
            await onStartAuth();
            result = await handleLogin({
                username,
                persistent,
                payload,
                password,
                api,
            });
        } catch (e) {
            const { code } = getApiError(e);

            if (code === API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO) {
                if (appName !== APPS.PROTONACCOUNT) {
                    handleVpnToAccountSSORedirect({ externalRedirect, productParam, username });
                    return;
                }
                onChangeAuthTypeData({ type: AuthType.ExternalSSO });
                triggerSSOLoginNotification();
                return;
            } else if (code === API_CUSTOM_ERROR_CODES.INVALID_LOGIN) {
                updateErrorMessage(e);
                return;
            }

            throw e;
        }

        return onSubmit({
            authType: AuthType.Srp,
            authResponse: result.authResult.result,
            authVersion: result.authResult.authVersion,
            uid: undefined,
            payload,
            username,
            password,
            persistent,
        });
    };

    useEffect(() => {
        if (
            !externalSSO.options ||
            externalSSO.options.token ||
            authTypeData.type !== AuthType.ExternalSSO ||
            externalSSO.options.flow !== ExternalSSOFlow.Redirect
        ) {
            return;
        }
        triggerSSOLoginNotification();
    }, []);

    useEffect(() => {
        if (
            submitting ||
            !externalSSO.options ||
            !externalSSO.options.token ||
            authTypeData.type !== AuthType.ExternalSSO ||
            onceRef.current
        ) {
            return;
        }
        onceRef.current = true;
        withSubmitting(
            handleSubmitExternalSSOToken({
                uid: undefined,
                token: externalSSO.options.token,
                payload: undefined,
            })
        ).catch(handleError);
    }, []);

    const abortExternalSSO = () => {
        externalSSOState?.abortController.abort();
        setExternalSSOState(undefined);
    };

    const usernameParams = username ? `?username=${username}` : '';
    const signinHelpPath = `${paths.signinHelp}${usernameParams}`;
    const resetPath = `${paths.reset}${usernameParams}`;
    const forgotUsernamePath = `${paths.forgotUsername}${usernameParams}`;

    useEffect(() => {
        // This handles the case for:
        // 1) Being on the unlock/2fa screen and hitting the back button
        // 2) Being on the unlock/2fa screen and hitting the browser back button e.g. ending up on signup and then
        // going back here
        // And preemptively starting it before user interaction
        onStartAuth().catch(noop);
        return () => {
            externalSSOState?.abortController.abort();
        };
    }, []);

    const checkboxEl = hasRemember && !isElectronApp && (
        <div className="flex flex-row items-start">
            <Checkbox
                id="staySignedIn"
                className="mt-2 mr-2"
                checked={persistent}
                onChange={submitting ? noop : () => setPersistent(!persistent)}
            />

            <div className="flex-1">
                <Label htmlFor="staySignedIn" className="flex items-center">
                    {c('Label').t`Keep me signed in`}
                </Label>
                <div className="color-weak">
                    {c('Info').jt`Recommended on trusted devices. ${keepMeSignedInLearnMoreLink}`}
                </div>
            </div>
        </div>
    );

    const errorEl = errorMsg && (
        <div
            data-testid="login:error-block"
            className="mb-4 bg-weak w-full border-none pl-3 pr-4 py-3 gap-3 rounded-lg flex items-start flex-nowrap"
        >
            <div className="flex justify-start items-start shrink-0 pt-0.5">
                <Icon name="exclamation-circle-filled" className="color-danger shrink-0" />
            </div>
            {errorMsg}
        </div>
    );

    const usernameEl = () => (
        <InputFieldTwo
            id="username"
            bigger
            autoFocus
            label={authTypeData.type === AuthType.ExternalSSO ? c('Label').t`Email` : c('Label').t`Email or username`}
            error={validator([requiredValidator(username)]) || !!errorMsg}
            disableChange={submitting}
            autoComplete="username"
            value={username}
            onValue={setUsername}
            ref={usernameRef}
            onChange={() => setErrorMsg(null)}
            readOnly={usernameReadOnly}
        />
    );

    const passwordEl = () => (
        <InputFieldTwo
            id="password"
            bigger
            label={authTypeData.type === AuthType.AutoSrp ? c('Label').t`Enter your password` : c('Label').t`Password`}
            error={validator([requiredValidator(password)]) || !!errorMsg}
            as={PasswordInputTwo}
            disableChange={submitting}
            autoComplete="current-password"
            autoFocus={authTypeData.type === AuthType.AutoSrp}
            value={password}
            onValue={setPassword}
            rootClassName="mt-2"
            onChange={() => setErrorMsg(null)}
        />
    );

    if (authTypeData.type === AuthType.Auto || authTypeData.type === AuthType.AutoSrp) {
        return (
            <form
                name="loginForm"
                data-testid="login-form-auto"
                onSubmit={(event) => {
                    event.preventDefault();
                    setErrorMsg(null);
                    if (authTypeData.type === AuthType.Auto) {
                        if (submitting || !onFormSubmit()) {
                            return;
                        }
                        withSubmitting(handleSubmitAuto()).catch(handleError);
                    } else if (authTypeData.type === AuthType.AutoSrp) {
                        if (submitting || !onFormSubmit()) {
                            return;
                        }
                        withSubmitting(handleSubmitSrp()).catch(handleError);
                    }
                }}
                method="post"
            >
                <Challenge empty tabIndex={-1} challengeRef={challengeRefLogin} type={0} name="login" />
                {(() => {
                    if (authTypeData.type === AuthType.Auto) {
                        return (
                            <>
                                {usernameEl()}
                                <div className="mb-4">
                                    <Link to={forgotUsernamePath}>{c('Link').t`Forgot email?`}</Link>
                                </div>
                                {checkboxEl}
                                <Button
                                    size="large"
                                    color="norm"
                                    type="submit"
                                    fullWidth
                                    loading={submitting}
                                    className={modal ? 'mt-4' : 'mt-6'}
                                >
                                    {c('Action').t`Continue`}
                                </Button>
                                {externalSSOState && (
                                    <Button
                                        size="large"
                                        type="button"
                                        shape="ghost"
                                        color="norm"
                                        fullWidth
                                        className="mt-2"
                                        onClick={() => {
                                            abortExternalSSO();
                                        }}
                                    >
                                        {c('Action').t`Cancel`}
                                    </Button>
                                )}
                                {signUp && !modal && !usernameReadOnly && (
                                    <div className="text-center mt-6">
                                        {
                                            // translator: Full sentence "New to Proton? Create account"
                                            c('Go to sign up').jt`New to ${BRAND_NAME}? ${signUp}`
                                        }
                                    </div>
                                )}
                            </>
                        );
                    }

                    if (authTypeData.type === AuthType.AutoSrp) {
                        return (
                            <>
                                <input id="username" readOnly value={username} hidden />
                                {passwordEl()}
                                <div className="mb-4">
                                    <Link
                                        to={
                                            // Checking the path here because VPN doesn't support the sign in with another device functionality
                                            paths.signinHelp ? signinHelpPath : resetPath
                                        }
                                    >
                                        {c('Link').t`Forgot password?`}
                                    </Link>
                                </div>
                                {errorEl && <div className="mt-4">{errorEl}</div>}
                                <Button
                                    size="large"
                                    color="norm"
                                    type="submit"
                                    fullWidth
                                    loading={submitting}
                                    className={modal ? 'mt-4' : 'mt-6'}
                                >
                                    {
                                        // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
                                        submitting ? c('Action').t`Signing in` : signInText
                                    }
                                </Button>
                            </>
                        );
                    }
                })()}
            </form>
        );
    }

    return (
        <>
            <form
                name="loginForm"
                data-testid="login-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    setErrorMsg(null);

                    if (authTypeData.type === AuthType.Srp) {
                        if (submitting || !onFormSubmit()) {
                            return;
                        }
                        withSubmitting(handleSubmitSrp()).catch(handleError);
                    } else {
                        if (submitting) {
                            return;
                        }
                        withSubmitting(handleSubmitExternalSSO()).catch(handleError);
                    }
                }}
                method="post"
            >
                <Challenge empty tabIndex={-1} challengeRef={challengeRefLogin} type={0} name="login" />
                {usernameEl()}
                {authTypeData.type === AuthType.ExternalSSO ? null : passwordEl()}
                {errorEl}
                {authTypeData.type !== AuthType.ExternalSSO && checkboxEl}
                <Button
                    size="large"
                    color="norm"
                    type="submit"
                    fullWidth
                    loading={submitting}
                    className={modal ? 'mt-4' : 'mt-6'}
                >
                    {
                        // translator: when the "sign in" button is in loading state, it gets updated to "Signing in"
                        submitting ? c('Action').t`Signing in` : signInText
                    }
                </Button>

                {(() => {
                    if (authTypeData.type === AuthType.ExternalSSO) {
                        return (
                            <>
                                {externalSSOState && (
                                    <Button
                                        size="large"
                                        type="button"
                                        shape="ghost"
                                        color="norm"
                                        fullWidth
                                        className="mt-2"
                                        onClick={() => {
                                            abortExternalSSO();
                                        }}
                                    >
                                        {c('Action').t`Cancel`}
                                    </Button>
                                )}
                                {!externalSSOState && (
                                    <div className="text-center mt-4">
                                        <InlineLinkButton
                                            type="button"
                                            color="norm"
                                            disabled={submitting}
                                            onClick={() => {
                                                abortExternalSSO();
                                                onChangeAuthTypeData({ type: AuthType.Srp });
                                                setPassword('');
                                            }}
                                        >
                                            {c('Action').t`Sign in with password`}
                                        </InlineLinkButton>
                                    </div>
                                )}
                            </>
                        );
                    }

                    return (
                        <>
                            {signUp && !modal && !usernameReadOnly && (
                                <div className="text-center mt-4">
                                    {
                                        // translator: Full sentence "New to Proton? Create account"
                                        c('Go to sign up').jt`New to ${BRAND_NAME}? ${signUp}`
                                    }
                                </div>
                            )}

                            {!modal && (
                                <>
                                    <hr className="my-4" />

                                    <div className="text-center">
                                        <SupportDropdown
                                            buttonClassName="mx-auto link link-focus"
                                            content={c('Link').t`Trouble signing in?`}
                                        >
                                            <Link
                                                to={resetPath}
                                                className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                                            >
                                                <Icon name="key" />
                                                {c('Link').t`Forgot password?`}
                                            </Link>
                                            <Link
                                                to={forgotUsernamePath}
                                                className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                                            >
                                                <Icon name="user-circle" />
                                                {c('Link').t`Forgot username?`}
                                            </Link>
                                            {
                                                /* VPN unsupported, check path */
                                                paths.signinAnotherDevice && (
                                                    <Link
                                                        to={paths.signinAnotherDevice}
                                                        className="dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left"
                                                    >
                                                        <Icon name="qr-code" />
                                                        {c('edm').t`Sign in with QR code`}
                                                    </Link>
                                                )
                                            }
                                        </SupportDropdown>
                                    </div>
                                </>
                            )}
                        </>
                    );
                })()}
            </form>
        </>
    );
};

export default LoginForm;
