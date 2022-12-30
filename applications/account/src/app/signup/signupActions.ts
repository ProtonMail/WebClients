import { VerificationModel } from '@proton/components/containers/api/humanVerification/interface';
import { AppIntent } from '@proton/components/containers/login/interface';
import { getAllAddresses, updateAddress } from '@proton/shared/lib/api/addresses';
import { auth } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { subscribe } from '@proton/shared/lib/api/payments';
import { updateEmail, updateLocale, updatePhone } from '@proton/shared/lib/api/settings';
import {
    getUser,
    queryCheckEmailAvailability,
    queryCheckUsernameAvailability,
    queryCreateUser,
    queryCreateUserExternal,
} from '@proton/shared/lib/api/user';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { CLIENT_TYPES, COUPON_CODES, TOKEN_TYPES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { withAuthHeaders, withVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { localeCode } from '@proton/shared/lib/i18n';
import { Api, HumanVerificationMethodType, User } from '@proton/shared/lib/interfaces';
import { handleSetupKeys } from '@proton/shared/lib/keys';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import {
    HumanVerificationData,
    HumanVerificationTrigger,
    SignupActionResponse,
    SignupCacheResult,
    SignupSteps,
    SignupType,
    SubscriptionData,
} from './interfaces';

const getSignupTypeQuery = (accountData: SignupCacheResult['accountData'], setupVPN: boolean) => {
    // VPN requests the recovery email, and does not create the address (avoid passing Domain)
    if (accountData.signupType === SignupType.VPN) {
        let extra = {};
        if (setupVPN) {
            extra = { Domain: accountData.domain };
        }
        return { ...extra, Email: accountData.recoveryEmail };
    }
    if (accountData.signupType === SignupType.Username) {
        return { Domain: accountData.domain };
    }
};

const getReferralDataQuery = (referralData: SignupCacheResult['referralData']) => {
    if (referralData) {
        return {
            ReferralID: referralData.invite,
            ReferralIdentifier: referralData.referrer,
        };
    }
};

const hvHandler = (error: any, trigger: HumanVerificationData['trigger']): HumanVerificationData => {
    const { code, details } = getApiError(error);
    if (code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED) {
        if (!details?.HumanVerificationToken) {
            throw error;
        }
        return {
            title: details.Title,
            methods: details.HumanVerificationMethods || [],
            token: details.HumanVerificationToken || '',
            trigger,
        };
    }
    throw error;
};

export const handleDone = async ({
    cache,
    appIntent = cache.appIntent,
}: {
    cache: SignupCacheResult;
    appIntent?: AppIntent;
}): Promise<SignupActionResponse> => {
    const {
        persistent,
        trusted,
        setupData,
        accountData: { password },
    } = cache;
    if (!setupData?.authResponse) {
        throw new Error('Missing auth response');
    }
    const { authResponse, user, keyPassword } = setupData;

    return {
        session: {
            ...authResponse,
            persistent,
            trusted,
            User: user,
            loginPassword: password,
            keyPassword: keyPassword,
            flow: 'signup',
            appIntent: appIntent,
        },
        to: SignupSteps.Done,
    };
};

export const handleSaveRecovery = async ({
    cache,
    recoveryEmail,
    recoveryPhone,
}: {
    cache: SignupCacheResult;
    recoveryEmail?: string;
    recoveryPhone?: string;
}): Promise<SignupActionResponse> => {
    const {
        ignoreExplore,
        setupData,
        accountData: { password, signupType },
    } = cache;

    const { authApi } = setupData!;

    await Promise.all([
        !!recoveryPhone &&
            srpAuth({ api: authApi, credentials: { password }, config: updatePhone({ Phone: recoveryPhone }) }),
        // Always send an update to the recovery email address when signing up with an external email address because the API sets it by default, so the client
        // needs to reset it to an empty string if the user chooses to not save a recovery email address.
        (!!recoveryEmail || signupType === SignupType.Email) &&
            srpAuth({
                api: authApi,
                credentials: { password },
                config: updateEmail({ Email: recoveryEmail || '' }),
            }).catch((e) => {
                const { code } = getApiError(e);
                // Ignore the error the API throws when updating the recovery email address to the external email address until it's fixed.
                if (code === API_CUSTOM_ERROR_CODES.USER_UPDATE_EMAIL_SELF && signupType === SignupType.Email) {
                    return;
                }
                throw e;
            }),
    ]);

    if (ignoreExplore) {
        return handleDone({ cache, appIntent: cache.appIntent });
    }

    return {
        cache,
        to: SignupSteps.Explore,
    };
};

export const handleDisplayName = async ({
    cache,
    displayName,
}: {
    cache: SignupCacheResult;
    displayName: string;
}): Promise<SignupActionResponse> => {
    const { setupData, accountData, ignoreExplore } = cache;

    const {
        authApi,
        addresses: [firstAddress],
    } = setupData!;

    await authApi(updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature }));
    // Re-fetch the user to get the updated display name
    const user = await authApi<{ User: User }>(getUser()).then(({ User }) => User);

    const to = (() => {
        if (accountData.signupType === SignupType.Email) {
            // Ignore recovery step if signing up with an external email address because it's automatically set.
            return ignoreExplore ? undefined : SignupSteps.Explore;
        }
        // The next step is recovery by default
        return SignupSteps.SaveRecovery;
    })();

    if (!to) {
        return handleDone({ cache, appIntent: cache.appIntent });
    }

    return {
        cache: {
            ...cache,
            setupData: {
                ...setupData!,
                user,
            },
        },
        to,
    };
};

export const handleSetupUser = async ({
    cache,
    api,
}: {
    cache: SignupCacheResult;
    api: Api;
}): Promise<SignupActionResponse> => {
    const {
        accountData: { username, email, domain, password, signupType },
        referralData,
        subscriptionData,
        persistent,
        clientType,
    } = cache;

    const userEmail = (() => {
        if (signupType === SignupType.Username) {
            return `${username}@${domain}`;
        }
        if (signupType === SignupType.VPN) {
            return username;
        }
        if (signupType === SignupType.Email) {
            return email;
        }
        throw new Error('Unknown type');
    })();

    const authResponse = await srpAuth({
        api,
        credentials: {
            username: userEmail,
            password,
        },
        config: auth({ Username: userEmail }),
    }).then((response): Promise<AuthResponse> => response.json());

    const authApi = <T>(config: any) => api<T>(withAuthHeaders(authResponse.UID, authResponse.AccessToken, config));

    // Perform the subscription first to prevent "locked user" while setting up keys.
    if (hasPlanIDs(subscriptionData.planIDs)) {
        await authApi(
            subscribe(
                {
                    Plans: subscriptionData.planIDs,
                    Currency: subscriptionData.currency,
                    Cycle: subscriptionData.cycle,
                    ...(referralData
                        ? { Codes: [COUPON_CODES.REFERRAL], Amount: 0 }
                        : {
                              Payment: subscriptionData.payment,
                              Amount: subscriptionData.checkResult.AmountDue,
                              ...(subscriptionData.checkResult.Coupon?.Code
                                  ? { Codes: [subscriptionData.checkResult.Coupon.Code] }
                                  : undefined),
                          }),
                },
                cache.productParam
            )
        );
    }

    const [{ keyPassword, user, addresses }] = await Promise.all([
        (async () => {
            // NOTE: For VPN signup, the API doesn't automatically create an address, so this will simply return an empty
            // array, and keys won't be setup.
            const addresses = await getAllAddresses(authApi);

            const keyPassword = addresses.length
                ? await handleSetupKeys({
                      api: authApi,
                      addresses,
                      password,
                  })
                : undefined;

            const user = await authApi<{ User: User }>(getUser()).then(({ User }) => User);
            return { keyPassword, user, addresses };
        })(),
        authApi(updateLocale(localeCode)).catch(noop),
    ]);

    const trusted = false;
    await persistSession({ ...authResponse, User: user, keyPassword, api: authApi, persistent, trusted });

    const newCache: SignupCacheResult = {
        ...cache,
        trusted,
        setupData: {
            user,
            keyPassword,
            addresses,
            authResponse,
            authApi,
        },
    };

    // Ignore the rest of the steps for VPN because we don't create an address and ask for recovery email at the start
    if (signupType === SignupType.VPN || clientType === CLIENT_TYPES.VPN) {
        return handleDone({ cache: newCache, appIntent: cache.appIntent });
    }

    return {
        cache: newCache,
        to: SignupSteps.Congratulations,
    };
};

const handleCreateUser = async ({
    cache,
    api,
}: {
    cache: SignupCacheResult;
    api: Api;
}): Promise<SignupActionResponse> => {
    const {
        accountData: { signupType, username, email, password, payload },
        accountData,
        humanVerificationResult,
        inviteData,
        referralData,
        clientType,
        setupVPN,
    } = cache;

    if (signupType === SignupType.Username || signupType === SignupType.VPN) {
        const humanVerificationParameters = (() => {
            if (humanVerificationResult) {
                return {
                    token: humanVerificationResult.token,
                    tokenType: humanVerificationResult.tokenType,
                };
            }
            if (inviteData) {
                return {
                    token: `${inviteData.selector}:${inviteData.token}`,
                    tokenType: 'invite' as const,
                };
            }
        })();
        try {
            const { User } = await srpVerify<{ User: User }>({
                api,
                credentials: { password },
                config: withVerificationHeaders(
                    humanVerificationParameters?.token,
                    humanVerificationParameters?.tokenType,
                    queryCreateUser({
                        Type: clientType,
                        Username: username,
                        Payload: payload,
                        ...getSignupTypeQuery(accountData, setupVPN),
                        ...getReferralDataQuery(referralData),
                    })
                ),
            });
            return {
                to: SignupSteps.CreatingAccount,
                cache: {
                    ...cache,
                    userData: {
                        User,
                    },
                },
            };
        } catch (error) {
            const { code } = getApiError(error);
            if (
                code === API_CUSTOM_ERROR_CODES.USER_CREATE_TOKEN_INVALID &&
                humanVerificationParameters?.tokenType === 'invite'
            ) {
                // Automatically try again if the invite was invalid for some reason, HV will be prompted.
                return handleCreateUser({
                    cache: {
                        ...cache,
                        inviteData: undefined,
                    },
                    api,
                });
            }
            const humanVerificationData = hvHandler(error, HumanVerificationTrigger.UserCreation);
            return {
                cache: {
                    ...cache,
                    humanVerificationData,
                },
                to: SignupSteps.HumanVerification,
            };
        }
    }

    if (signupType === SignupType.Email) {
        const { User } = await srpVerify<{ User: User }>({
            api,
            credentials: { password },
            config: withVerificationHeaders(
                cache.humanVerificationResult?.token,
                cache.humanVerificationResult?.tokenType,
                queryCreateUserExternal({
                    Type: clientType,
                    Email: email,
                    Payload: payload,
                })
            ),
        });
        return {
            to: SignupSteps.CreatingAccount,
            cache: {
                ...cache,
                userData: {
                    User,
                },
            },
        };
    }

    throw new Error('Unknown signup type');
};

export const handlePayment = ({
    api,
    cache,
    subscriptionData,
}: {
    api: Api;
    cache: SignupCacheResult;
    subscriptionData: SubscriptionData;
}): Promise<SignupActionResponse> => {
    let humanVerificationResult = cache.humanVerificationResult;

    if (
        (cache.accountData.signupType === SignupType.Username || cache.accountData.signupType === SignupType.VPN) &&
        subscriptionData.payment &&
        'Token' in subscriptionData.payment.Details
    ) {
        // Use payment token to prove humanity for a username paid account
        humanVerificationResult = {
            token: subscriptionData.payment.Details.Token,
            tokenType: TOKEN_TYPES.PAYMENT,
        };
    }

    return handleCreateUser({
        cache: {
            ...cache,
            humanVerificationResult,
            subscriptionData,
        },
        api,
    });
};

export const handleSelectPlan = async ({
    api,
    cache,
    subscriptionData,
}: {
    api: Api;
    cache: SignupCacheResult;
    subscriptionData: SubscriptionData;
}): Promise<SignupActionResponse> => {
    if (subscriptionData.checkResult.Amount > 0 && hasPlanIDs(subscriptionData.planIDs)) {
        return {
            cache: {
                ...cache,
                subscriptionData,
            },
            to: SignupSteps.Payment,
        };
    }

    return handleCreateUser({
        cache: {
            ...cache,
            subscriptionData,
        },
        api,
    });
};

export const handleCreateAccount = async ({
    cache,
    api,
}: {
    cache: SignupCacheResult;
    api: Api;
}): Promise<SignupActionResponse> => {
    const {
        accountData: { username, email, domain, signupType },
        humanVerificationResult,
        setupVPN,
    } = cache;
    if (signupType === SignupType.Username || (signupType === SignupType.VPN && setupVPN)) {
        await api(queryCheckUsernameAvailability(`${username}@${domain}`, true));
    } else if (signupType === SignupType.VPN) {
        await api(queryCheckUsernameAvailability(username));
    } else if (signupType === SignupType.Email) {
        try {
            await api(
                withVerificationHeaders(
                    humanVerificationResult?.token,
                    humanVerificationResult?.tokenType,
                    queryCheckEmailAvailability(email)
                )
            );
        } catch (error) {
            const humanVerificationData = hvHandler(error, HumanVerificationTrigger.ExternalCheck);
            return {
                cache: {
                    ...cache,
                    humanVerificationData,
                },
                to: SignupSteps.HumanVerification,
            };
        }
    }

    if (cache.referralData?.referrer) {
        return {
            cache,
            to: SignupSteps.TrialPlan,
        };
    }

    if (cache.subscriptionData.checkResult.Amount > 0 && hasPlanIDs(cache.subscriptionData.planIDs)) {
        return {
            cache,
            to: SignupSteps.Payment,
        };
    }

    if (!cache.subscriptionData.skipUpsell) {
        return {
            cache,
            to: SignupSteps.Upsell,
        };
    }

    return handleCreateUser({
        cache,
        api,
    });
};

export const handleHumanVerification = async ({
    api,
    cache,
    token,
    tokenType,
    verificationModel,
}: {
    api: Api;
    cache: SignupCacheResult;
    token: string;
    tokenType: HumanVerificationMethodType;
    verificationModel?: VerificationModel;
}): Promise<SignupActionResponse> => {
    const humanVerificationResult = {
        token,
        tokenType,
        verificationModel,
    };

    if (cache.humanVerificationData?.trigger === HumanVerificationTrigger.ExternalCheck) {
        return handleCreateAccount({
            cache: {
                ...cache,
                humanVerificationResult,
            },
            api,
        });
    }

    if (cache.humanVerificationData?.trigger === HumanVerificationTrigger.UserCreation) {
        return handleCreateUser({
            cache: {
                ...cache,
                humanVerificationResult,
            },
            api,
        });
    }

    throw new Error('Human verification triggered from unknown step');
};
