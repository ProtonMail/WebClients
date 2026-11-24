import { generateDeferredMnemonicData } from '@proton/account/recovery/recoveryKit/generateDeferredMnemonicData';
import { createPreAuthKTVerifier } from '@proton/key-transparency/shared/createPreAuthKTVerifier';
import { createPaymentSubscription } from '@proton/payments/core/api/createPaymentSubscription';
import type { BillingAddress } from '@proton/payments/core/billing-address/billing-address';
import type { Currency, Cycle, ExtendedTokenPayment, PlanIDs } from '@proton/payments/core/interface';
import { hasFreePlanIDs } from '@proton/payments/core/planIDs';
import { getCodes } from '@proton/payments/core/subscription/helpers';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth } from '@proton/shared/lib/api/auth';
import type { ReferralRegistrationPlan } from '@proton/shared/lib/api/core/referrals';
import { postReferralRegistration } from '@proton/shared/lib/api/core/referrals';
import { updateLocale } from '@proton/shared/lib/api/settings';
import { queryUnlock } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { sendPasswordChangeMessageToTabs } from '@proton/shared/lib/authentication/passwordChangeMessage';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { User } from '@proton/shared/lib/interfaces/User';
import type { ReferralData } from '@proton/shared/lib/interfaces/referral';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import { handleSetupKeys } from '@proton/shared/lib/keys/setupKeys';
import { deviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecoveryHelper';
import { srpAuth } from '@proton/shared/lib/srp';
import { isPaid } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { type AccountData, SignupType } from '../../../signup/interfaces';

export interface SignupContextSubscriptionData {
    currency: Currency;
    cycle: Cycle;
    planIDs: PlanIDs;
    checkResult: SubscriptionEstimation;
    paymentToken: ExtendedTokenPayment | undefined;
    billingAddress: BillingAddress;
    vatNumber: string | undefined;
    trial?: boolean;
}

export const handleSubscribeUser = async (
    api: Api,
    subscriptionData: SignupContextSubscriptionData,
    {
        productParam,
        build,
        telemetryContext,
    }: {
        productParam: ProductParam;
        build: APP_NAMES;
        telemetryContext: PaymentTelemetryContext;
    }
) => {
    if (hasFreePlanIDs(subscriptionData.planIDs)) {
        return;
    }

    const Codes = getCodes({ coupon: subscriptionData.checkResult.Coupon?.Code });

    const { Subscription } = await createPaymentSubscription(
        api,
        {
            Plans: subscriptionData.planIDs,
            Currency: subscriptionData.currency,
            Cycle: subscriptionData.cycle,
            BillingAddress: subscriptionData.billingAddress,
            VatId: subscriptionData.vatNumber,
            ...(subscriptionData.trial ? { StartTrial: true } : {}),
            ...{
                Payment: subscriptionData.paymentToken,
                Amount: subscriptionData.checkResult.AmountDue,
                ...(Codes.length ? { Codes } : undefined),
            },
        },
        {
            product: productParam,
            build,
            telemetryContext,
            // A new user has neither
            userCurrency: undefined,
            subscription: undefined,
            paymentMethodType: subscriptionData.paymentToken?.paymentMethodType,
            paymentMethodValue: subscriptionData.paymentToken?.paymentMethodValue,
        }
    );

    return Subscription;
};

const setupKeys = async ({
    api,
    keyTransparencyActivation,
    password,
    productParam,
    deferred = false,
}: {
    /** The flow sets the keys up later, with `handleSetPassword`. */
    deferred?: boolean;
    password: string;
    api: Api;
    keyTransparencyActivation: KeyTransparencyActivation;
    productParam: ProductParam;
}) => {
    // NOTE: For VPN signup, the API doesn't automatically create an address, so this will simply return an empty
    // array, and keys won't be setup.
    const addresses = await getAllAddresses(api);

    if (deferred) {
        const user = await getUser(api);
        return { keySetupData: { keyPassword: '', clearKeyPassword: '' }, user, addresses };
    }

    const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(keyTransparencyActivation);

    let keySetupData = {
        keyPassword: '',
        clearKeyPassword: '',
    };
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

/** Trusts the device as sign-in does: a persistent session of an account with device recovery stores it */
const persistSignupSession = async ({
    authResponse,
    keySetupData,
    user,
    api,
    persistent,
    keyTransparencyActivation,
}: {
    authResponse: AuthResponse;
    keySetupData: { keyPassword: string; clearKeyPassword: string };
    user: User;
    api: Api;
    persistent: boolean;
    keyTransparencyActivation: KeyTransparencyActivation;
}) => {
    const preAuthKTVerifier = createPreAuthKTVerifier(keyTransparencyActivation);
    // Trust is best-effort: the keys are already set up, so a failure here must not fail the signup
    const deviceRecoveryResult = await deviceRecovery({
        keyPassword: keySetupData.keyPassword,
        persistent,
        user,
        // Loaded again: the addresses of the key setup are from before it created their keys
        addresses: undefined,
        api,
        preAuthKTVerifier,
    }).catch(() => ({ user, trusted: false }));
    const session = await persistSession({
        ...authResponse,
        keyPassword: keySetupData.keyPassword,
        clearKeyPassword: keySetupData.clearKeyPassword,
        User: deviceRecoveryResult.user,
        api,
        persistent,
        trusted: deviceRecoveryResult.trusted,
        source: SessionSource.Proton,
    });
    await preAuthKTVerifier.preAuthKTCommit(deviceRecoveryResult.user.ID, api);
    return { session, user: deviceRecoveryResult.user };
};

export const handleSetupUser = async ({
    accountData,
    api,
    persistent,
    subscriptionData,
    productParam,
    keyTransparencyActivation,
    traceSignupSentryError,
    referralData,
    referralRegistrationPlan,
    build,
    telemetryContext,
    deferKeySetup,
    isRetry = false,
}: {
    deferKeySetup?: boolean;
    /** A previous attempt may have subscribed before failing, so the subscription is skipped if the user is paid. */
    isRetry?: boolean;
    accountData: AccountData;
    api: Api;
    persistent: boolean;
    subscriptionData: SignupContextSubscriptionData | undefined;
    productParam: ProductParam;
    keyTransparencyActivation: KeyTransparencyActivation;
    traceSignupSentryError: (error: any) => void;
    referralData: ReferralData | undefined;
    referralRegistrationPlan: ReferralRegistrationPlan | undefined;
    build: APP_NAMES;
    telemetryContext: PaymentTelemetryContext;
}) => {
    const { username, email, domain, password, signupType } = accountData;

    const userEmail = (() => {
        if (signupType === SignupType.Proton) {
            return `${username}@${domain}`;
        }
        if (signupType === SignupType.External) {
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

    const alreadySubscribed = isRetry && isPaid(await getUser(api));
    let subscription: Subscription | undefined;
    if (
        subscriptionData &&
        /**
         * No need to create subscription for referrals.
         * Referral registration will handle the subscription.
         */
        !referralData &&
        !alreadySubscribed
    ) {
        // Perform the subscription first to prevent "locked user" while setting up keys.
        subscription = await handleSubscribeUser(api, subscriptionData, {
            productParam,
            build,
            telemetryContext,
        });
    }

    void api(updateLocale(localeCode)).catch(noop);

    const keysResult = await setupKeys({
        api,
        keyTransparencyActivation,
        password,
        productParam,
        deferred: deferKeySetup,
    });
    const { keySetupData, addresses } = keysResult;

    const { session, user } = await persistSignupSession({
        authResponse,
        keySetupData,
        user: keysResult.user,
        api,
        persistent,
        keyTransparencyActivation,
    });

    let recoveryPhraseData;
    try {
        // Without keys there is nothing to recover yet
        recoveryPhraseData = deferKeySetup
            ? undefined
            : await generateDeferredMnemonicData({
                  emailAddress: userEmail,
                  username: user.Name,
                  getUserKeys: async () => {
                      const userKeys = await getDecryptedUserKeysHelper(user, keySetupData.keyPassword);
                      return userKeys;
                  },
                  api,
              });
    } catch (error) {
        /**
         * Silently error.
         * We can continue signup flow
         */
        traceSignupSentryError(error);
    }

    if (referralData) {
        const referralRegistrationSubscription = (() => {
            if (subscriptionData && subscriptionData.paymentToken?.Details?.Token) {
                return {
                    paymentToken: subscriptionData.paymentToken.Details.Token,
                    billingAddress: subscriptionData.billingAddress,
                    code: subscriptionData.checkResult.Coupon?.Code,
                    currency: subscriptionData.currency,
                    planIDs: subscriptionData.planIDs,
                };
            }
            return undefined;
        })();

        await api(
            postReferralRegistration({
                plan: referralRegistrationPlan,
                referralData,
                referralRegistrationSubscription,
            })
        );
    }

    return {
        session,
        user,
        keyPassword: keySetupData.keyPassword,
        clearKeyPassword: keySetupData.clearKeyPassword,
        addresses,
        authResponse,
        subscription,
        recoveryPhraseData,
    };
};

/** Sets up the keys that `handleSetupUser` deferred, with the password the user chose. */
export const handleSetPassword = async ({
    api,
    accountData,
    setupResult,
    newPassword,
    persistent,
    productParam,
    keyTransparencyActivation,
}: {
    api: Api;
    accountData: AccountData;
    setupResult: Awaited<ReturnType<typeof handleSetupUser>>;
    newPassword: string;
    persistent: boolean;
    productParam: ProductParam;
    keyTransparencyActivation: KeyTransparencyActivation;
}) => {
    // The user can take more than 10 minutes to choose a password, which loses the locked scope: this adds it back
    await srpAuth({ api, credentials: { password: accountData.password }, config: queryUnlock() });
    const keysResult = await setupKeys({
        api,
        keyTransparencyActivation,
        password: newPassword,
        productParam,
    });
    const { keySetupData, addresses } = keysResult;

    const { session, user } = await persistSignupSession({
        authResponse: setupResult.authResponse,
        keySetupData,
        user: keysResult.user,
        api,
        persistent,
        keyTransparencyActivation,
    });

    sendPasswordChangeMessageToTabs({ localID: setupResult.authResponse.LocalID, status: true });

    return {
        ...setupResult,
        session,
        user,
        addresses,
        keyPassword: keySetupData.keyPassword,
        clearKeyPassword: keySetupData.clearKeyPassword,
    };
};
