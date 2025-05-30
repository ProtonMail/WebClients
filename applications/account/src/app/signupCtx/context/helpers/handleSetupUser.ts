import { createPreAuthKTVerifier } from '@proton/key-transparency/lib';
import {
    type BillingAddress,
    COUPON_CODES,
    type Currency,
    type Cycle,
    type ExtendedTokenPayment,
    type PaymentsVersion,
    type PlanIDs,
    type V5PaymentToken,
    isTokenPayment,
    isWrappedPaymentsVersion,
    setPaymentMethodV4,
    setPaymentMethodV5,
    subscribe,
} from '@proton/payments';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth } from '@proton/shared/lib/api/auth';
import { updateLocale } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import { type ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { type AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type RequiredCheckResponse } from '@proton/shared/lib/helpers/checkout';
import { hasFreePlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { localeCode } from '@proton/shared/lib/i18n';
import type { Api, KeyTransparencyActivation, User } from '@proton/shared/lib/interfaces';
import { handleSetupKeys } from '@proton/shared/lib/keys';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { type AccountData, type ReferralData, SignupType } from '../../../signup/interfaces';

export interface SubscriptionData2 {
    currency: Currency;
    cycle: Cycle;
    planIDs: PlanIDs;
    checkResult: RequiredCheckResponse;
    paymentToken: ExtendedTokenPayment | undefined;
    billingAddress: BillingAddress;
}

const handleSubscribeUser = async (
    api: Api,
    subscriptionData: SubscriptionData2,
    referralData: ReferralData | undefined,
    productParam: ProductParam,
    onPaymentSuccess?: () => void,
    onPaymentFailure?: () => void
) => {
    if (hasFreePlanIDs(subscriptionData.planIDs)) {
        return;
    }

    try {
        let paymentsVersion: PaymentsVersion;
        if (subscriptionData.paymentToken?.paymentsVersion) {
            paymentsVersion = subscriptionData.paymentToken.paymentsVersion;
        } else if (referralData) {
            paymentsVersion = 'v5';
        } else {
            paymentsVersion = 'v4';
        }

        await api(
            subscribe(
                {
                    Plans: subscriptionData.planIDs,
                    Currency: subscriptionData.currency,
                    Cycle: subscriptionData.cycle,
                    BillingAddress: subscriptionData.billingAddress,
                    ...(referralData
                        ? { Codes: [COUPON_CODES.REFERRAL], Amount: 0 }
                        : {
                              Payment: subscriptionData.paymentToken,
                              Amount: subscriptionData.checkResult.AmountDue,
                              ...(subscriptionData.checkResult.Coupon?.Code
                                  ? { Codes: [subscriptionData.checkResult.Coupon.Code] }
                                  : undefined),
                          }),
                },
                productParam,
                paymentsVersion
            )
        );

        onPaymentSuccess?.();

        if (subscriptionData.checkResult.AmountDue === 0 && isTokenPayment(subscriptionData.paymentToken)) {
            if (
                isWrappedPaymentsVersion(subscriptionData.paymentToken) &&
                subscriptionData.paymentToken.paymentsVersion === 'v5'
            ) {
                const v5PaymentToken: V5PaymentToken = {
                    PaymentToken: subscriptionData.paymentToken.Details.Token,
                    v: 5,
                };

                await api(setPaymentMethodV5({ ...subscriptionData.paymentToken, ...v5PaymentToken }));
            } else {
                await api(setPaymentMethodV4(subscriptionData.paymentToken));
            }
        }
    } catch (error: any) {
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
    referralData,
    productParam,
    keyTransparencyActivation,
}: {
    accountData: AccountData;
    api: Api;
    persistent: boolean;
    trusted: boolean;

    subscriptionData: SubscriptionData2 | undefined;
    referralData: ReferralData | undefined;
    productParam: ProductParam;
    keyTransparencyActivation: KeyTransparencyActivation;
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

    if (subscriptionData) {
        // Perform the subscription first to prevent "locked user" while setting up keys.
        await handleSubscribeUser(api, subscriptionData, referralData, productParam);
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

    return {
        session,
        user,
        keyPassword: keySetupData.keyPassword,
        addresses,
        authResponse,
    };
};
