import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import type { OnLoginCallback } from '@proton/components';
import {
    GenericError,
    InputFieldTwo,
    PasswordInputTwo,
    useApi,
    useConfig,
    useErrorHandler,
    useFormErrors,
    useKTActivation,
    useNotifications,
} from '@proton/components';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { AuthStep, AuthType } from '@proton/components/containers/login/interface';
import { handleLogin, handleNextLogin } from '@proton/components/containers/login/loginActions';
import useLoading from '@proton/hooks/useLoading';
import { authJwt } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getUser } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getToAppFromSubscribed } from '@proton/shared/lib/authentication/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
} from '@proton/shared/lib/helpers/formValidators';
import type { Address, Api, Organization, User } from '@proton/shared/lib/interfaces';
import { createPreAuthKTVerifier } from '@proton/shared/lib/keyTransparency';
import { generateKeySaltAndPassphrase, getResetAddressesKeysV2 } from '@proton/shared/lib/keys';
import type { ParsedUnprivatizationData } from '@proton/shared/lib/keys/unprivatization';
import {
    parseUnprivatizationData,
    setupKeysWithUnprivatization,
    validateUnprivatizationData,
} from '@proton/shared/lib/keys/unprivatization';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';
import { getUnprivatizationContextData } from '@proton/shared/lib/keys/unprivatization/helper';

import { getTerms } from '../signup/terms';
import ExpiredError from './ExpiredError';
import JoinOrganizationAdminItem from './JoinOrganizationAdminItem';
import Layout from './Layout';
import Main from './Main';
import { stripQueryParams } from './jwt';

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
}

const JoinMagicLinkContainer = ({ onLogin, onUsed, toApp, productParam }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const { APP_NAME: appName } = useConfig();
    const { validator, onFormSubmit } = useFormErrors();
    const handleError = useErrorHandler();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const ktActivation = useKTActivation();
    const dataRef = useRef<{
        user: User;
        organization: Organization;
        organizationLogo: OrganizationData['organizationLogo'];
        authApi: Api;
        addresses: Address[];
        parsedUnprivatizationData: ParsedUnprivatizationData;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, withSubmitting] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const { createNotification } = useNotifications();

    useEffect(() => {
        const init = async () => {
            const fragmentParams = location.hash.substring(1);
            const params = new URLSearchParams(fragmentParams);
            const token = stripQueryParams(params.get('token'));

            if (!token) {
                setError({ type: ErrorType.API });
                return;
            }

            const { UID, AccessToken } = await silentApi<{
                UID: string;
                AccessToken: string;
            }>(authJwt({ Token: token }));
            const authApi = getAuthAPI(UID, AccessToken, silentApi);

            const prepareData = async () => {
                const [
                    user,
                    {
                        organizationData: { organization, organizationLogo },
                        addresses,
                        data: unprivatizationData,
                    },
                ] = await Promise.all([
                    authApi<{ User: User }>(getUser()).then(({ User }) => User),
                    getUnprivatizationContextData({ api: authApi }),
                ]);
                const parsedUnprivatizationData = await parseUnprivatizationData({ unprivatizationData, addresses });
                await validateUnprivatizationData({
                    userContext: {
                        appName,
                        getUser: async () => user,
                        getUserKeys: async () => [], // User keys do not exist in this case
                        getAddressKeys: async () => [], // Address keys do not exist in this context
                    },
                    api: authApi,
                    verifyOutboundPublicKeys,
                    parsedUnprivatizationData,
                    options: {
                        validateRevision: true,
                        newMemberCreation: true,
                    },
                });
                dataRef.current = {
                    user,
                    organization,
                    organizationLogo,
                    addresses,
                    parsedUnprivatizationData,
                    authApi,
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
            dataRef.current?.organizationLogo?.cleanup();
        };
    }, []);

    const handleSetup = async () => {
        if (!dataRef.current) {
            throw new Error('missing data');
        }
        const { user, authApi, addresses, parsedUnprivatizationData } = dataRef.current;
        const preAuthKTVerifier = createPreAuthKTVerifier(ktActivation);

        const { passphrase, salt } = await generateKeySaltAndPassphrase(newPassword);
        const { onSKLPublishSuccess, ...resetPayload } = await getResetAddressesKeysV2({
            addresses,
            passphrase,
            preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        });
        if (!resetPayload.privateKeys || !onSKLPublishSuccess) {
            throw new Error('Missing keys payload');
        }

        await setupKeysWithUnprivatization({
            api: authApi,
            password: newPassword,
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
            password: newPassword,
            persistent: false,
        };

        const initialLoginResult = await handleLogin({
            username: data.username,
            persistent: data.persistent,
            payload: undefined,
            password: data.password,
            api: silentApi,
        });

        await preAuthKTVerifier.preAuthKTCommit(user.ID, silentApi);

        const result = await handleNextLogin({
            api: silentApi,
            appName: APPS.PROTONACCOUNT,
            toApp,
            ignoreUnlock: false,
            setupVPN: false,
            ktActivation,
            username: data.username,
            password: data.password,
            persistent: data.persistent,
            authType: AuthType.SRP,
            authResponse: initialLoginResult.authResult.result,
            authVersion: initialLoginResult.authResult.authVersion,
            productParam,
            verifyOutboundPublicKeys,
        });
        if (result.to === AuthStep.DONE) {
            const subscribedToApp = toApp || getToAppFromSubscribed(user);
            await onLogin({ ...result.session, ...(subscribedToApp ? { appIntent: { app: subscribedToApp } } : {}) });
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

        const { addresses, parsedUnprivatizationData, organization } = data;
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
                    organizationLogoUrl={data?.organizationLogo?.url}
                    organizationName={organizationName}
                    adminEmail={adminEmail}
                />
                <hr className="my-6 border-bottom border-weak" />
                <form
                    name="loginForm"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!onFormSubmit()) {
                            return;
                        }
                        withSubmitting(handleSetup()).catch((error) => {
                            const { status } = getApiError(error);
                            // Session expired.
                            if (status === HTTP_STATUS_CODE.UNAUTHORIZED) {
                                createNotification({
                                    type: 'error',
                                    text: c('Error').t`Session expired. Please refresh the page.`,
                                });
                                return;
                            }
                            handleError(error);
                        });
                    }}
                    method="post"
                >
                    <InputFieldTwo
                        id="username"
                        bigger
                        label={c('Label').t`Username`}
                        readOnly
                        disableChange={true}
                        value={username}
                    />
                    <InputFieldTwo
                        as={PasswordInputTwo}
                        id="password"
                        bigger
                        label={c('Label').t`New password`}
                        assistiveText={getMinPasswordLengthMessage()}
                        error={validator([passwordLengthValidator(newPassword)])}
                        disableChange={loading}
                        autoFocus
                        autoComplete="new-password"
                        value={newPassword}
                        onValue={setNewPassword}
                    />
                    <InputFieldTwo
                        as={PasswordInputTwo}
                        id="password-repeat"
                        bigger
                        label={c('Label').t`Confirm password`}
                        error={validator([
                            passwordLengthValidator(confirmNewPassword),
                            confirmPasswordValidator(confirmNewPassword, newPassword),
                        ])}
                        disableChange={loading}
                        autoComplete="new-password"
                        value={confirmNewPassword}
                        onValue={setConfirmNewPassword}
                        rootClassName="mt-2"
                    />

                    <Button size="large" color="norm" type="submit" fullWidth loading={submitting} className="mt-4">
                        {c('Action').t`Continue`}
                    </Button>
                    <div className="color-weak text-sm text-center mt-4">{getTerms(toApp || APPS.PROTONACCOUNT)}</div>
                </form>
            </Main>
        </Layout>
    );
};

export default JoinMagicLinkContainer;
