import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, InputFieldTwo, PasswordInputTwo, useFormErrors } from '@proton/components/components';
import { GenericError, OnLoginCallback } from '@proton/components/containers';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { AuthStep } from '@proton/components/containers/login/interface';
import { handleLogin, handleNextLogin } from '@proton/components/containers/login/loginActions';
import { useApi, useErrorHandler } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { authJwt } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryMemberUnprivatizationInfo } from '@proton/shared/lib/api/members';
import { getOrganization } from '@proton/shared/lib/api/organization';
import { getUser } from '@proton/shared/lib/api/user';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { Address, Api, MemberUnprivatizationOutput, Organization, User } from '@proton/shared/lib/interfaces';
import {
    ParsedUnprivatizationData,
    parseUnprivatizationData,
    setupKeysWithUnprivatization,
    validateInvitationDataValues,
    validateUnprivatizationData,
} from '@proton/shared/lib/keys/unprivatization';

import ExpiredError from './ExpiredError';
import Header from './Header';
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
    productParam: ProductParam;
    toAppName?: string;
    toApp?: APP_NAMES;
}

const JoinMagicLinkContainer = ({ onLogin, toApp, productParam }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const { validator, onFormSubmit } = useFormErrors();
    const handleError = useErrorHandler();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const ktActivation = useKTActivation();
    const dataRef = useRef<{
        user: User;
        organization: Organization;
        authApi: Api;
        addresses: Address[];
        unprivatizationData: MemberUnprivatizationOutput;
        parsedUnprivatizationData: ParsedUnprivatizationData;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, withSubmitting] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

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
                const [user, organization, addresses, unprivatizationData] = await Promise.all([
                    authApi<{ User: User }>(getUser()).then(({ User }) => User),
                    authApi<{ Organization: Organization }>(getOrganization()).then(({ Organization }) => Organization),
                    getAllAddresses(authApi),
                    authApi<MemberUnprivatizationOutput>(queryMemberUnprivatizationInfo()),
                ]);
                const parsedUnprivatizationData = await parseUnprivatizationData({ unprivatizationData });
                await validateUnprivatizationData({
                    api: authApi,
                    verifyOutboundPublicKeys,
                    unprivatizationData,
                    parsedUnprivatizationData,
                });
                await validateInvitationDataValues({
                    api: authApi,
                    addresses,
                    invitationData: parsedUnprivatizationData.invitationData,
                });
                dataRef.current = {
                    user,
                    organization,
                    addresses,
                    unprivatizationData,
                    parsedUnprivatizationData,
                    authApi,
                };
            };

            await prepareData();
        };

        init()
            .catch((error) => {
                const { code } = getApiError(error);
                if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                    setError({ type: ErrorType.Expired });
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

    const handleSetup = async () => {
        if (!dataRef.current) {
            throw new Error('missing data');
        }
        const { user, authApi, addresses, parsedUnprivatizationData } = dataRef.current;
        await setupKeysWithUnprivatization({
            user,
            api: authApi,
            addresses,
            password: newPassword,
            parsedUnprivatizationData,
            ktActivation,
        });

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
            authResponse: initialLoginResult.authResult.result,
            authVersion: initialLoginResult.authResult.authVersion,
            productParam,
        });
        if (result.to === AuthStep.DONE) {
            await onLogin(result.session);
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
    const adminEmail = data?.unprivatizationData.AdminEmail;
    const username = data?.addresses?.[0]?.Email;
    const organizationName = data?.organization.Name;

    const user = (
        <div className="flex items-start w-full text-left rounded relative">
            <span
                className="flex rounded w-custom h-custom bg-weak"
                style={{
                    '--w-custom': '2.25rem',
                    '--h-custom': '2.25rem',
                }}
            >
                <span className="m-auto text-semibold" aria-hidden="true">
                    <Icon name="user" />
                </span>
            </span>
            <div className="account-button-content mx-3 flex-1 mt-custom" style={{ '--mt-custom': `-0.25em` }}>
                <div className="text-left">
                    <div className="text-break text-semibold">{adminEmail}</div>
                    {organizationName && <div className="text-break text-sm">{organizationName}</div>}
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <Main>
                <div>
                    <div className="color-weak mb-2">{c('Info').t`This is an invitation from:`}</div>
                    {user}
                    <div className="mt-6 mb-6">
                        <hr />
                    </div>
                </div>
                <Header title={c('Info').t`Set your password`} />
                <form
                    name="loginForm"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!onFormSubmit()) {
                            return;
                        }
                        withSubmitting(handleSetup()).catch(handleError);
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
                </form>
            </Main>
        </Layout>
    );
};

export default JoinMagicLinkContainer;
