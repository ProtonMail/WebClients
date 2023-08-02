import { format } from 'date-fns';

import { createPreAuthKTVerifier } from '@proton/components/containers';
import { VerificationModel } from '@proton/components/containers/api/humanVerification/interface';
import { AppIntent } from '@proton/components/containers/login/interface';
import type { generatePDFKit } from '@proton/recovery-kit';
import { getAllAddresses, updateAddress } from '@proton/shared/lib/api/addresses';
import { auth } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { subscribe } from '@proton/shared/lib/api/payments';
import { updateEmail, updateLocale, updatePhone } from '@proton/shared/lib/api/settings';
import { reactivateMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import {
    getUser,
    queryCheckEmailAvailability,
    queryCheckUsernameAvailability,
    unlockPasswordChanges,
} from '@proton/shared/lib/api/user';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession, persistSessionWithPassword } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { CLIENT_TYPES, COUPON_CODES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { withVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { localeCode } from '@proton/shared/lib/i18n';
import { Api, HumanVerificationMethodType, User } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getDecryptedUserKeysHelper, handleSetupKeys } from '@proton/shared/lib/keys';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import { generateMnemonicPayload, generateMnemonicWithSalt } from '@proton/shared/lib/mnemonic';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import {
    HumanVerificationTrigger,
    MnemonicData,
    ReferralData,
    SignupActionDoneResponse,
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
}): SignupActionDoneResponse => {
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
        cache,
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

export const handleSetPassword = async ({
    cache,
    api,
    newPassword,
}: {
    cache: SignupCacheResult;
    api: Api;
    newPassword: string;
}): Promise<SignupActionResponse> => {
    const { persistent, setupData, accountData } = cache;
    const user = setupData?.user;
    if (!setupData || !user) {
        throw new Error('Missing user');
    }

    const userKeys = await getDecryptedUserKeysHelper(user, setupData.keyPassword || '');
    const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(newPassword);
    const updateKeysPayload = await getUpdateKeysPayload([], userKeys, undefined, keyPassword, keySalt, true);

    await srpAuth({
        api,
        credentials: {
            password: accountData.password,
        },
        config: unlockPasswordChanges(),
    });
    await srpVerify({
        api,
        credentials: {
            password: newPassword,
        },
        config: updatePrivateKeyRoute(updateKeysPayload),
    });

    await persistSessionWithPassword({
        api,
        keyPassword,
        User: user,
        UID: setupData?.authResponse.UID,
        LocalID: setupData?.authResponse.LocalID,
        persistent,
        trusted: false,
    });

    const updatedUser = await api<{ User: User }>(getUser()).then(({ User }) => User);

    return {
        cache: {
            ...cache,
            accountData: {
                ...accountData,
                password: newPassword,
            },
            setupData: {
                ...setupData,
                keyPassword,
                user: updatedUser,
            },
        },
        to: SignupSteps.Congratulations,
    };
};

export const handleSetupRecoveryPhrase = async ({
    cache,
}: {
    cache: SignupCacheResult;
    api: Api;
}): Promise<SignupActionResponse> => {
    return {
        cache,
        to: SignupSteps.Congratulations,
    };
};

export const getSubscriptionMetricsData = (
    subscriptionData: SubscriptionData
): {
    type: 'free' | 'cc' | 'pp' | 'btc';
} => {
    if (!hasPlanIDs(subscriptionData.planIDs)) {
        return {
            type: 'free',
        };
    }
    return {
        type: subscriptionData.type || 'cc',
    };
};

export const handleSubscribeUser = async (
    api: Api,
    subscriptionData: SubscriptionData,
    referralData: ReferralData | undefined,
    productParam: ProductParam
) => {
    if (!hasPlanIDs(subscriptionData.planIDs)) {
        return;
    }
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
            productParam
        )
    );
};

interface SetupMnemonic {
    enabled: boolean;
    generate?: typeof generatePDFKit;
}

export const handleSetupMnemonic = async ({
    user,
    keyPassword,
    api,
    emailAddress,
    setupMnemonic,
}: {
    api: Api;
    setupMnemonic?: SetupMnemonic;
    emailAddress: string;
    user: User;
    keyPassword?: string;
}): Promise<MnemonicData | undefined> => {
    if (!setupMnemonic?.enabled || !setupMnemonic.generate || !user.Keys.length) {
        return;
    }

    const { randomBytes, salt, mnemonic } = await generateMnemonicWithSalt();

    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword || '');

    const payload = await generateMnemonicPayload({ randomBytes, salt, userKeys, api, username: user.Name });

    try {
        await api({ ...reactivateMnemonicPhrase(payload), ignoreHandler: [HTTP_ERROR_CODES.UNLOCK] });
    } catch (e) {
        // TODO: Improve this error handling. Just ignore any failures for now so that it doesn't get stuck
        return;
    }

    const pdf = await setupMnemonic.generate({
        // Not translated because the PDF isn't translated
        date: `Created on ${format(new Date(), 'PPP')}`,
        emailAddress,
        recoveryPhrase: mnemonic,
    });

    const blob = new Blob([pdf.buffer], { type: 'application/pdf' });

    return {
        mnemonic,
        blob,
    };
};

export const handleSetupUser = async ({
    cache,
    api,
    ignoreVPN,
    setupMnemonic,
}: {
    cache: SignupCacheResult;
    api: Api;
    ignoreVPN?: boolean;
    setupMnemonic?: SetupMnemonic;
}): Promise<SignupActionResponse> => {
    const {
        accountData: { username, email, domain, password, signupType },
        referralData,
        subscriptionData,
        persistent,
        clientType,
        ktActivation,
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
    await handleSubscribeUser(api, subscriptionData, referralData, cache.productParam);

    const [{ keyPassword, user, addresses }] = await Promise.all([
        (async () => {
            // NOTE: For VPN signup, the API doesn't automatically create an address, so this will simply return an empty
            // array, and keys won't be setup.
            const addresses = await getAllAddresses(api);

            const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(ktActivation, api);

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

    const mnemonicData = await handleSetupMnemonic({
        emailAddress: userEmail,
        user,
        keyPassword,
        api,
        setupMnemonic,
    });

    const newCache: SignupCacheResult = {
        ...cache,
        trusted,
        setupData: {
            user,
            keyPassword,
            addresses,
            authResponse,
            mnemonicData,
            api,
        },
    };

    // Ignore the rest of the steps for VPN because we don't create an address and ask for recovery email at the start
    if (clientType === CLIENT_TYPES.VPN && !ignoreVPN) {
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
