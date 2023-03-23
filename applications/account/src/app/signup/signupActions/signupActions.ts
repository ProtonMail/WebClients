import { createPreAuthKTVerifier } from '@proton/components/containers';
import { VerificationModel } from '@proton/components/containers/api/humanVerification/interface';
import { AppIntent } from '@proton/components/containers/login/interface';
import { getAllAddresses, updateAddress } from '@proton/shared/lib/api/addresses';
import { auth } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { subscribe } from '@proton/shared/lib/api/payments';
import { updateEmail, updateLocale, updatePhone } from '@proton/shared/lib/api/settings';
import { getUser, queryCheckEmailAvailability, queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { CLIENT_TYPES, COUPON_CODES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { withVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { localeCode } from '@proton/shared/lib/i18n';
import { Api, HumanVerificationMethodType, User } from '@proton/shared/lib/interfaces';
import { handleSetupKeys } from '@proton/shared/lib/keys';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import {
    HumanVerificationTrigger,
    SignupActionResponse,
    SignupCacheResult,
    SignupSteps,
    SignupType,
    SubscriptionData,
} from '../interfaces';
import { handleCreateUser } from './handleCreateUser';
import { hvHandler } from './helpers';

export const handleDone = ({
    cache,
    appIntent = cache.appIntent,
}: {
    cache: SignupCacheResult;
    appIntent?: AppIntent;
}): SignupActionResponse => {
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

    const { api } = setupData!;

    await Promise.all([
        !!recoveryPhone && srpAuth({ api, credentials: { password }, config: updatePhone({ Phone: recoveryPhone }) }),
        // Always send an update to the recovery email address when signing up with an external email address because the API sets it by default, so the client
        // needs to reset it to an empty string if the user chooses to not save a recovery email address.
        (!!recoveryEmail || signupType === SignupType.Email) &&
            srpAuth({
                api,
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
        api,
        addresses: [firstAddress],
    } = setupData!;

    await api(updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature }));
    // Re-fetch the user to get the updated display name
    const user = await api<{ User: User }>(getUser()).then(({ User }) => User);

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
        config: auth({ Username: userEmail }, persistent),
    }).then((response): Promise<AuthResponse> => response.json());

    // Perform the subscription first to prevent "locked user" while setting up keys.
    if (hasPlanIDs(subscriptionData.planIDs)) {
        await api(
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
            const addresses = await getAllAddresses(api);

            const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(api);

            const keyPassword = addresses.length
                ? await handleSetupKeys({
                      api,
                      addresses,
                      password,
                      preAuthKTVerify,
                  })
                : undefined;

            const user = await api<{ User: User }>(getUser()).then(({ User }) => User);
            await preAuthKTCommit(user.ID);
            return { keyPassword, user, addresses };
        })(),
        api(updateLocale(localeCode)).catch(noop),
    ]);

    const trusted = false;
    await persistSession({ ...authResponse, User: user, keyPassword, api, persistent, trusted });

    const newCache: SignupCacheResult = {
        ...cache,
        trusted,
        setupData: {
            user,
            keyPassword,
            addresses,
            authResponse,
            api,
        },
    };

    // Ignore the rest of the steps for VPN because we don't create an address and ask for recovery email at the start
    if (clientType === CLIENT_TYPES.VPN) {
        return handleDone({ cache: newCache, appIntent: cache.appIntent });
    }

    return {
        cache: newCache,
        to: SignupSteps.Congratulations,
    };
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
    return handleCreateUser({
        cache: {
            ...cache,
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

export const usernameAvailabilityError = 'UsernameAvailabilityError';

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
    } = cache;

    try {
        if (signupType === SignupType.Username) {
            await api(queryCheckUsernameAvailability(`${username}@${domain}`, true));
        }
    } catch (error: any) {
        error.type = usernameAvailabilityError;
        throw error;
    }

    if (signupType === SignupType.Email) {
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
