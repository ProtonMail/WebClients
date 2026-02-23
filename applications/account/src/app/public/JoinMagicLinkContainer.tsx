import { Fragment, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import type { OnLoginCallback } from '@proton/components';
import {
    GenericError,
    InputFieldTwo,
    NotificationButton,
    useConfig,
    useErrorHandler,
    useNotifications,
} from '@proton/components';
import { AuthStep, AuthType } from '@proton/components/containers/login/interface';
import { handleLogin, handleNextLogin } from '@proton/components/containers/login/loginActions';
import { createPreAuthKTVerifier } from '@proton/key-transparency/shared';
import { authJwt } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
// eslint-disable-next-line no-restricted-imports
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getToAppFromSubscribed } from '@proton/shared/lib/authentication/apps';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import { APPS, type APP_NAMES, BRAND_NAME, HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Address, Api, KeyTransparencyActivation, User } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getResetAddressesKeysV2 } from '@proton/shared/lib/keys';
import type { ParsedUnprivatizationData } from '@proton/shared/lib/keys/unprivatization';
import {
    parseUnprivatizationData,
    setupKeysWithUnprivatization,
    validateUnprivatizationData,
} from '@proton/shared/lib/keys/unprivatization';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';
import { getUnprivatizationContextData } from '@proton/shared/lib/keys/unprivatization/helper';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import { getLocaleTermsURL } from '../content/helper';
import SetPasswordWithPolicyForm from '../login/SetPasswordWithPolicyForm';
import { useGetAccountKTActivation } from '../useGetAccountKTActivation';
import ExpiredError from './ExpiredError';
import JoinOrganizationAdminItem from './JoinOrganizationAdminItem';
import Layout from './Layout';
import Main from './Main';
import { stripQueryParams } from './jwt';

const getTerms = (app: APP_NAMES) => {
    const terms = (
        <Fragment key="terms">
            <br />
            <Href href={getLocaleTermsURL(app)}>{
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }</Href>
        </Fragment>
    );

    // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
    return c('new_plans: signup').jt`By creating a ${BRAND_NAME} account, you agree to our ${terms}`;
};

enum ErrorType {
    Expired,
    Used,
    API,
}

interface Props {
    onLogin: OnLoginCallback;
    onUsed: () => void;
    productParam: ProductParam;
    toAppName?: string;
    toApp?: APP_NAMES;
    onPreSubmit?: () => Promise<void>;
    onPreload?: () => void;
    api: Api;
    unauthenticatedApi: UnauthenticatedApi;
}

const JoinMagicLinkContainer = ({
    api,
    unauthenticatedApi,
    onPreload,
    onPreSubmit,
    onLogin,
    onUsed,
    toApp,
    productParam,
}: Props) => {
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const { APP_NAME: appName } = useConfig();
    const handleError = useErrorHandler();
    const dataRef = useRef<{
        user: User;
        organizationData: OrganizationData;
        authApi: Api;
        addresses: Address[];
        parsedUnprivatizationData: ParsedUnprivatizationData;
        ktActivation: KeyTransparencyActivation;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const { createNotification } = useNotifications();
    const getKtActivation = useGetAccountKTActivation();

    useEffect(() => {
        const init = async () => {
            const fragmentParams = location.hash.substring(1);
            const params = new URLSearchParams(fragmentParams);
            const token = stripQueryParams(params.get('token'));
            onPreload?.();

            if (!token) {
                setError({ type: ErrorType.API });
                return;
            }

            const silentApi = getSilentApi(api);
            const { UID, AccessToken } = await silentApi<{
                UID: string;
                AccessToken: string;
            }>(authJwt({ Token: token }));
            const authApi = getAuthAPI(UID, AccessToken, silentApi);

            await onPreSubmit?.();

            const prepareData = async () => {
                const [user, { organizationData, addresses, data: unprivatizationData }] = await Promise.all([
                    getUser(authApi),
                    getUnprivatizationContextData({ api: authApi }),
                ]);
                const parsedUnprivatizationData = await parseUnprivatizationData({ unprivatizationData, addresses });
                const ktActivation = await getKtActivation();
                await validateUnprivatizationData({
                    ktUserContext: {
                        ktActivation,
                        appName,
                        getUser: async () => user,
                        getUserKeys: async () => [], // User keys do not exist in this case
                    },
                    api: authApi,
                    parsedUnprivatizationData,
                    options: {
                        validateRevision: true,
                        newMemberCreation: true,
                    },
                });
                dataRef.current = {
                    user,
                    organizationData,
                    addresses,
                    parsedUnprivatizationData,
                    authApi,
                    ktActivation,
                };
            };

            await prepareData();
        };

        init()
            .catch((error) => {
                const { code, message } = getApiError(error);
                if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                    setError({ type: ErrorType.Expired });
                } else if (code === API_CUSTOM_ERROR_CODES.JWT_REDIRECT_LOGIN) {
                    createNotification({ type: 'info', text: message });
                    onUsed();
                    setError({ type: ErrorType.Used });
                } else if (code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
                    setError({ type: ErrorType.Used });
                } else {
                    handleError(error);
                    setError({ type: ErrorType.API });
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        return () => {
            dataRef.current?.organizationData.logo?.cleanup();
        };
    }, []);

    const handleSetup = async ({ password }: { password: string }) => {
        if (!dataRef.current) {
            throw new Error('missing data');
        }
        const { user, authApi, addresses, parsedUnprivatizationData, ktActivation } = dataRef.current;
        const preAuthKTVerifier = createPreAuthKTVerifier(ktActivation);

        const { passphrase, salt } = await generateKeySaltAndPassphrase(password);
        const { onSKLPublishSuccess, ...resetPayload } = await getResetAddressesKeysV2({
            addresses,
            passphrase,
            supportV6Keys: false, // pqc: TODO (future), based on admin key version or separate setting.
            preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        });
        if (!resetPayload.privateKeys || !onSKLPublishSuccess) {
            throw new Error('Missing keys payload');
        }

        await setupKeysWithUnprivatization({
            api: authApi,
            password,
            parsedUnprivatizationData,
            payload: {
                ...resetPayload,
                salt,
            },
        });

        await onSKLPublishSuccess();

        const username = addresses?.[0]?.Email;
        const data = {
            username,
            password,
            persistent: false,
        };
        await unauthenticatedApi.startUnAuthFlow();
        const api = getSilentApi(unauthenticatedApi.apiCallback);
        const initialLoginResult = await handleLogin({
            username: data.username,
            persistent: data.persistent,
            payload: undefined,
            password: data.password,
            api,
        });

        await preAuthKTVerifier.preAuthKTCommit(user.ID, api);

        const result = await handleNextLogin({
            api,
            appName: APPS.PROTONACCOUNT,
            toApp,
            ignoreUnlock: false,
            setupVPN: false,
            ktActivation,
            username: data.username,
            password: data.password,
            persistent: data.persistent,
            authType: AuthType.Srp,
            authResponse: initialLoginResult.authResult.result,
            authVersion: initialLoginResult.authResult.authVersion,
            productParam,
        });
        if (result.to === AuthStep.DONE) {
            const subscribedToApp = toApp || getToAppFromSubscribed(user);
            await onLogin({ ...result.session, ...(subscribedToApp ? { appIntent: { app: subscribedToApp } } : {}) });
        }
    };
    const handleSubmitPassword = async ({ password }: { password: string }) => {
        try {
            await handleSetup({ password });
        } catch (error) {
            const { status } = getApiError(error);
            // Session expired.
            if (status === HTTP_STATUS_CODE.UNAUTHORIZED) {
                createNotification({
                    type: 'error',
                    text: (
                        <>
                            <span>{c('Error').t`Session expired. Please refresh the page.`}</span>
                            <NotificationButton onClick={() => window.location.reload()}>
                                {c('Action').t`Refresh the page`}
                            </NotificationButton>
                        </>
                    ),
                });
                return;
            }
            handleError(error);
        }
    };

    if (error) {
        return (
            <div className="absolute inset-center text-center">
                {(() => {
                    if (error.type === ErrorType.Expired) {
                        return <ExpiredError type="magic-link" />;
                    }
                    if (error.type === ErrorType.Used) {
                        return <ExpiredError type="magic-link-used" />;
                    }
                    return <GenericError />;
                })()}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="absolute inset-center text-center">
                <CircleLoader size="large" />
            </div>
        );
    }

    const data = dataRef.current;
    const { adminEmail, username, organizationName } = ((): {
        type: 'public' | 'private' | 'gsso';
        adminEmail: string;
        username: string;
        organizationName: string;
    } => {
        if (!data) {
            return {
                type: 'public' as const,
                adminEmail: '',
                username: '',
                organizationName: '',
            };
        }

        const {
            addresses,
            parsedUnprivatizationData,
            organizationData: { organization },
        } = data;
        return {
            type: parsedUnprivatizationData.type,
            adminEmail: parsedUnprivatizationData.payload.unprivatizationData.AdminEmail,
            username: addresses?.[0]?.Email || '',
            organizationName: organization.Name,
        };
    })();

    return (
        <Layout hasDecoration={true} toApp={toApp}>
            <Main>
                <JoinOrganizationAdminItem
                    organizationLogoUrl={data?.organizationData.logo?.url}
                    organizationName={organizationName}
                    adminEmail={adminEmail}
                />
                <hr className="my-6 border-bottom border-weak" />
                <SetPasswordWithPolicyForm
                    passwordPolicies={data?.organizationData.passwordPolicies ?? []}
                    onSubmit={handleSubmitPassword}
                    type="create"
                >
                    <InputFieldTwo
                        id="username"
                        bigger
                        label={c('Label').t`Username`}
                        readOnly
                        disableChange={true}
                        value={username}
                    />
                </SetPasswordWithPolicyForm>
                <div className="color-weak text-sm text-center mt-4">{getTerms(toApp || APPS.PROTONACCOUNT)}</div>
            </Main>
        </Layout>
    );
};

export default JoinMagicLinkContainer;
