import { createPreAuthKTVerifier } from '@proton/key-transparency/shared';
import {
    type BillingAddress,
    type Currency,
    type Cycle,
    type ExtendedTokenPayment,
    type FreeSubscription,
    type PaymentsVersion,
    type PlanIDs,
    type Subscription,
    type SubscriptionEstimation,
    hasFreePlanIDs,
} from '@proton/payments';
import { createPaymentSubscription } from '@proton/payments/core/api/createPaymentSubscription';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth } from '@proton/shared/lib/api/auth';
import type { ReferralRegistrationPlan } from '@proton/shared/lib/api/core/referrals';
import { postReferralRegistration } from '@proton/shared/lib/api/core/referrals';
import { updateLocale } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import type { Api, KeyTransparencyActivation, ReferralData, User } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper, handleSetupKeys } from '@proton/shared/lib/keys';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import generateDeferredMnemonicData from '../../../containers/recoveryPhrase/generateDeferredMnemonicData';
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
        userCurrency,
        subscription,
        onPaymentSuccess,
        onPaymentFailure,
    }: {
        productParam: ProductParam;
        build: APP_NAMES;
        telemetryContext: PaymentTelemetryContext;
        userCurrency: Currency | undefined;
        subscription: Subscription | FreeSubscription | undefined;
        onPaymentSuccess?: () => void;
        onPaymentFailure?: () => void;
    }
) => {
    if (hasFreePlanIDs(subscriptionData.planIDs)) {
        return;
    }

    let paymentsVersion: PaymentsVersion;
    if (subscriptionData.paymentToken?.paymentsVersion) {
        paymentsVersion = subscriptionData.paymentToken.paymentsVersion;
    } else {
        paymentsVersion = 'v4';
    }

    try {
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
                    ...(subscriptionData.checkResult.Coupon?.Code
                        ? { Codes: [subscriptionData.checkResult.Coupon.Code] }
                        : undefined),
                },
            },
            {
                product: productParam,
                version: paymentsVersion,
                build,
                telemetryContext,
                userCurrency,
                subscription,
                paymentMethodType: subscriptionData.paymentToken?.paymentMethodType,
                paymentMethodValue: subscriptionData.paymentToken?.paymentMethodValue,
            }
        );

        onPaymentSuccess?.();

        return Subscription;
    } catch (error) {
        onPaymentFailure?.();
        throw error;
    }
};

const setupKeys = async ({
    api,
    keyTransparencyActivation,
    password,
    productParam,
}: {
    password: string;
    api: Api;
    keyTransparencyActivation: KeyTransparencyActivation;
    productParam: ProductParam;
}) => {
    // NOTE: For VPN signup, the API doesn't automatically create an address, so this will simply return an empty
    // array, and keys won't be setup.
    const addresses = await getAllAddresses(api);

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

    const user = await api<{ User: User }>(getUser()).then(({ User }) => User);
    await preAuthKTCommit(user.ID, api);
    return { keySetupData, user, addresses };
};

export const handleSetupUser = async ({
    accountData,
    api,
    persistent,
    trusted,
    subscriptionData,
    productParam,
    keyTransparencyActivation,
    traceSignupSentryError,
    referralData,
    referralRegistrationPlan,
    build,
    telemetryContext,
}: {
    accountData: AccountData;
    api: Api;
    persistent: boolean;
    trusted: boolean;
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

    let subscription: Subscription | undefined;
    if (
        subscriptionData &&
        /**
         * No need to create subscription for referrals.
         * Referral registration will handle the subscription.
         */
        !referralData
    ) {
        // Perform the subscription first to prevent "locked user" while setting up keys.
        subscription = await handleSubscribeUser(api, subscriptionData, {
            productParam,
            build,
            telemetryContext,
            userCurrency: undefined,
            subscription: undefined,
        });
    }

    void api(updateLocale(localeCode)).catch(noop);

    const { keySetupData, user, addresses } = await setupKeys({
        api,
        keyTransparencyActivation,
        password,
        productParam,
    });

    const session = await persistSession({
        ...authResponse,
        keyPassword: keySetupData.keyPassword,
        clearKeyPassword: keySetupData.clearKeyPassword,
        User: user,
        api,
        persistent,
        trusted,
        source: SessionSource.Proton,
    });

    let recoveryPhraseData;
    try {
        recoveryPhraseData = await generateDeferredMnemonicData({
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
