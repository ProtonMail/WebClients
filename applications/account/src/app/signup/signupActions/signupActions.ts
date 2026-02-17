import { MAX_CHARS_API } from '@proton/account';
import { startEasySwitchSignupImportTask } from '@proton/activation/src/api';
import { EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import type { AppIntent } from '@proton/components/containers/login/interface';
import { createPreAuthKTVerifier } from '@proton/key-transparency';
import type { Subscription } from '@proton/payments';
import { type PaymentsVersion, SubscriptionMode, hasPlanIDs } from '@proton/payments';
import { createPaymentSubscription } from '@proton/payments/core/api/createPaymentSubscription';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { getAllAddresses, updateAddress } from '@proton/shared/lib/api/addresses';
import { auth } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAllMembers, updateVPN } from '@proton/shared/lib/api/members';
import { createPasswordlessOrganizationKeys, updateOrganizationName } from '@proton/shared/lib/api/organization';
import { updateEmail, updateLocale, updatePhone } from '@proton/shared/lib/api/settings';
import { queryUnlock } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { sendPasswordChangeMessageToTabs } from '@proton/shared/lib/authentication/passwordChangeMessage';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, CLIENT_TYPES, KEYGEN_CONFIGS, KEYGEN_TYPES, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { localeCode } from '@proton/shared/lib/i18n';
import type { Api, KeyTransparencyActivation, User } from '@proton/shared/lib/interfaces';
import {
    generatePasswordlessOrganizationKey,
    getDecryptedUserKeysHelper,
    handleSetupKeys,
} from '@proton/shared/lib/keys';
import { srpAuth } from '@proton/shared/lib/srp';
import { hasPaidVpn } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import generateDeferredMnemonicData from '../../containers/recoveryPhrase/generateDeferredMnemonicData';
import type { DeferredMnemonicData } from '../../containers/recoveryPhrase/types';
import type {
    SignupActionDoneResponse,
    SignupActionResponse,
    SignupCacheResult,
    SubscriptionData,
} from '../interfaces';
import { SignupType } from '../interfaces';

export const handleDone = ({
    cache,
    appIntent = cache.appIntent,
}: {
    cache: SignupCacheResult;
    appIntent?: AppIntent;
}): SignupActionDoneResponse => {
    const {
        setupData,
        accountData: { password },
    } = cache;
    if (!setupData?.authResponse) {
        throw new Error('Missing auth response');
    }
    const { session } = setupData;

    // Users that creates an account after a logout don't have appIntent, forcing it here
    if (isElectronMail) {
        appIntent = {
            app: APPS.PROTONMAIL,
        };
    }

    return {
        cache,
        session: {
            data: session,
            loginPassword: password,
            flow: 'signup',
            appIntent: appIntent,
        },
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
}): Promise<void> => {
    const {
        setupData,
        accountData: { password, signupType },
    } = cache;

    const { api } = setupData!;

    await Promise.all([
        !!recoveryPhone && srpAuth({ api, credentials: { password }, config: updatePhone({ Phone: recoveryPhone }) }),
        // Always send an update to the recovery email address when signing up with an external email address because the API sets it by default, so the client
        // needs to reset it to an empty string if the user chooses to not save a recovery email address.
        (!!recoveryEmail || signupType === SignupType.External) &&
            srpAuth({
                api,
                credentials: { password },
                config: updateEmail({ Email: recoveryEmail || '' }),
            }).catch((e) => {
                const { code } = getApiError(e);
                // Ignore the error the API throws when updating the recovery email address to the external email address until it's fixed.
                if (code === API_CUSTOM_ERROR_CODES.USER_UPDATE_EMAIL_SELF && signupType === SignupType.External) {
                    return;
                }
                throw e;
            }),
    ]);
};

export const handleDisplayName = async ({
    cache,
    displayName,
}: {
    cache: SignupCacheResult;
    displayName: string;
}): Promise<SignupCacheResult> => {
    const { setupData } = cache;

    const {
        api,
        addresses: [firstAddress],
    } = setupData!;

    await api(updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature }));
    // Re-fetch the user to get the updated display name
    const user = await getUser(api);

    return {
        ...cache,
        setupData: {
            ...setupData!,
            user,
        },
    };
};

const handleSetupKeysHelper = async ({
    api,
    ktActivation,
    password,
    productParam,
    setupKeys,
}: {
    password: string;
    api: Api;
    ktActivation: KeyTransparencyActivation;
    productParam: ProductParam;
    setupKeys: boolean;
}) => {
    // NOTE: For VPN signup, the API doesn't automatically create an address, so this will simply return an empty
    // array, and keys won't be setup.
    const addresses = await getAllAddresses(api);

    let keySetupData = {
        keyPassword: '',
        clearKeyPassword: '',
    };

    if (!setupKeys) {
        const user = await getUser(api);
        return { keySetupData, user, addresses };
    }

    const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(ktActivation);
    if (addresses.length) {
        const keyPassword = await handleSetupKeys({
            api,
            addresses,
            password,
            preAuthKTVerify,
            product: productParam,
        });
        keySetupData = {
            keyPassword,
            clearKeyPassword: password,
        };
    }

    const user = await getUser(api);
    await preAuthKTCommit(user.ID, api);
    return { keySetupData, user, addresses };
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
    const { persistent, setupData, accountData, productParam, ktActivation } = cache;
    const maybeUser = setupData?.user;
    if (!setupData || !maybeUser) {
        throw new Error('Missing user');
    }

    // In VPN signup, keys are setup with a user action and if users wait more than 10 minutes
    // they lose locked scope. This ensures that locked scope is added before continuing. Even if it's not needed.
    await srpAuth({ api, credentials: { password: accountData.password }, config: queryUnlock() });
    const { keySetupData, user, addresses } = await handleSetupKeysHelper({
        api,
        ktActivation,
        password: newPassword,
        productParam,
        setupKeys: true,
    });

    const sessionResult = await persistSession({
        ...setupData.authResponse,
        clearKeyPassword: keySetupData.clearKeyPassword,
        keyPassword: keySetupData.keyPassword,
        User: user,
        api,
        persistent,
        trusted: false,
        source: SessionSource.Proton,
    });

    sendPasswordChangeMessageToTabs({ localID: setupData.authResponse.LocalID, status: true });

    return {
        cache: {
            ...cache,
            accountData: {
                ...accountData,
                password: newPassword,
            },
            setupData: {
                ...setupData,
                addresses,
                session: { ...sessionResult, User: user },
                user: user,
            },
        },
    };
};

export const handleSetupOrg = async ({
    api,
    user,
    password,
    keyPassword,
    orgName,
}: {
    api: Api;
    user: User;
    password: string;
    keyPassword: string;
    orgName: string;
}) => {
    const members = await getAllMembers(api);
    const selfMember = members.find(({ Self }) => !!Self);
    const selfMemberID = selfMember?.ID;
    const [userKey] = await getDecryptedUserKeysHelper(user, keyPassword);

    if (!selfMemberID) {
        throw new Error('Missing member id');
    }
    if (!userKey) {
        throw new Error('Missing user key');
    }

    // NOTE: By default the admin gets allocated all of the VPN connections. Here we artificially set the admin to the default value
    // So that other users can get connections allocated.
    if (hasPaidVpn(user)) {
        await api(updateVPN(selfMemberID, VPN_CONNECTIONS)).catch(noop);
    }

    // Slice the org name (to ensure the request passes validation), specifically for VPN B2B signup where it's passed as a query param and not validated.
    await api(updateOrganizationName(orgName.slice(0, MAX_CHARS_API.ORG_NAME)));

    const { encryptedToken, signature, privateKeyArmored } = await generatePasswordlessOrganizationKey({
        userKey: userKey.privateKey,
        keyGenConfig: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
    });

    await srpAuth({
        api,
        credentials: { password },
        config: createPasswordlessOrganizationKeys({
            Token: encryptedToken,
            Signature: signature,
            PrivateKey: privateKeyArmored,
            Members: [],
            AdminInvitations: [],
            AdminActivations: [],
            GroupAddressKeyTokens: [],
        }),
    });
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

export const handleSubscribeUser = async ({
    api,
    subscriptionData,
    productParam,
    hasZipCodeValidation,
    reportPaymentSuccess,
    reportPaymentFailure,
    telemetryContext,
}: {
    api: Api;
    subscriptionData: SubscriptionData;
    productParam: ProductParam;
    hasZipCodeValidation: boolean;
    reportPaymentSuccess: () => void;
    reportPaymentFailure: () => void;
    telemetryContext?: PaymentTelemetryContext;
}) => {
    if (!hasPlanIDs(subscriptionData.planIDs)) {
        return;
    }

    try {
        let paymentsVersion: PaymentsVersion;
        if (subscriptionData.payment?.paymentsVersion) {
            paymentsVersion = subscriptionData.payment.paymentsVersion;
        } else {
            paymentsVersion = 'v4';
        }

        const isTrial = subscriptionData.checkResult.SubscriptionMode === SubscriptionMode.Trial;

        const { Subscription } = await createPaymentSubscription(
            api,
            {
                Plans: subscriptionData.planIDs,
                Currency: subscriptionData.currency,
                Cycle: subscriptionData.cycle,
                BillingAddress: subscriptionData.billingAddress,
                VatId: subscriptionData.vatNumber,
                ...{
                    Payment: subscriptionData.payment,
                    Amount: subscriptionData.checkResult.AmountDue,
                    ...(subscriptionData.checkResult.Coupon?.Code
                        ? { Codes: [subscriptionData.checkResult.Coupon.Code] }
                        : undefined),
                    ...(isTrial ? { StartTrial: true } : {}),
                },
            },
            {
                build: APPS.PROTONACCOUNT,
                userCurrency: undefined,
                subscription: undefined,
                product: productParam,
                version: paymentsVersion,
                hasZipCodeValidation,
                telemetryContext: telemetryContext ?? 'other',
                paymentMethodType: subscriptionData.payment?.paymentMethodType,
                paymentMethodValue: subscriptionData.payment?.paymentMethodValue,
            }
        );

        reportPaymentSuccess();

        return Subscription;
    } catch (error: any) {
        reportPaymentFailure();
        throw error;
    }
};

export const handleSetupUser = async ({
    cache,
    api,
    ignoreVPN,
    canGenerateMnemonic,
    setupKeys = true,
    reportPaymentSuccess,
    reportPaymentFailure,
    hasZipCodeValidation,
    telemetryContext,
}: {
    cache: SignupCacheResult;
    api: Api;
    ignoreVPN?: boolean;
    canGenerateMnemonic: boolean;
    setupKeys?: boolean;
    reportPaymentSuccess: () => void;
    reportPaymentFailure: () => void;
    hasZipCodeValidation: boolean;
    telemetryContext?: PaymentTelemetryContext;
}): Promise<SignupActionResponse> => {
    const {
        accountData: { username, email, domain, password, signupType },
        referralData,
        subscriptionData,
        persistent,
        clientType,
        ktActivation,
        productParam,
    } = cache;

    const userEmail = (() => {
        if (signupType === SignupType.Proton) {
            return `${username}@${domain}`;
        }
        if (signupType === SignupType.External || signupType === SignupType.BringYourOwnEmail) {
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
    // Before, we needed to subscribe as a referral
    // The backend now takes care of this for us,
    // so we don't need to subscribe anymore on the frontend
    let subscription: Subscription | undefined;
    if (!referralData) {
        subscription = await handleSubscribeUser({
            api,
            subscriptionData,
            productParam,
            hasZipCodeValidation,
            reportPaymentSuccess,
            reportPaymentFailure,
            telemetryContext,
        });
    }

    api(updateLocale(localeCode)).catch(noop);

    const { keySetupData, user, addresses } = await handleSetupKeysHelper({
        api,
        ktActivation,
        password,
        productParam,
        setupKeys,
    });

    const trusted = false;
    const sessionResult = await persistSession({
        ...authResponse,
        clearKeyPassword: keySetupData.clearKeyPassword,
        keyPassword: keySetupData.keyPassword,
        User: user,
        api,
        persistent,
        trusted,
        source: SessionSource.Proton,
    });

    let mnemonicData: DeferredMnemonicData | undefined;
    if (canGenerateMnemonic) {
        mnemonicData = await generateDeferredMnemonicData({
            emailAddress: userEmail,
            username: user.Name,
            getUserKeys: async () => {
                const userKeys = await getDecryptedUserKeysHelper(user, keySetupData.keyPassword);
                return userKeys;
            },
            api,
        });
    }

    const newCache: SignupCacheResult = {
        ...cache,
        trusted,
        subscription,
        setupData: {
            user,
            session: sessionResult,
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

    // Start the easy switch import for pure BYOE accounts
    if (
        newCache.accountData?.signupType === SignupType.BringYourOwnEmail &&
        newCache.setupData?.addresses &&
        newCache.setupData?.addresses.length > 0
    ) {
        const addressID = newCache.setupData.addresses[0].ID;
        await api(
            startEasySwitchSignupImportTask({
                Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SIGNUP,
                AddressId: addressID,
                Provider: OAUTH_PROVIDER.GOOGLE,
            })
        );
    }

    return {
        cache: newCache,
    };
};
