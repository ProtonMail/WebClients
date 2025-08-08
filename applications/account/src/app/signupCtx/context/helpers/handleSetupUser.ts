import { createPreAuthKTVerifier } from '@proton/key-transparency/lib';
import {
    type BillingAddress,
    type Currency,
    type Cycle,
    type ExtendedTokenPayment,
    type PaymentsVersion,
    type PlanIDs,
    type Subscription,
    createSubscription,
    hasFreePlanIDs,
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
import { localeCode } from '@proton/shared/lib/i18n';
import type { Api, KeyTransparencyActivation, User } from '@proton/shared/lib/interfaces';
import { handleSetupKeys } from '@proton/shared/lib/keys';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { type AccountData, SignupType } from '../../../signup/interfaces';

export interface SubscriptionData2 {
    currency: Currency;
    cycle: Cycle;
    planIDs: PlanIDs;
    checkResult: RequiredCheckResponse;
    paymentToken: ExtendedTokenPayment | undefined;
    billingAddress: BillingAddress;
    vatNumber: string | undefined;
}

const handleSubscribeUser = async (
    api: Api,
    subscriptionData: SubscriptionData2,
    productParam: ProductParam,
    hasZipCodeValidation: boolean,
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
        } else {
            paymentsVersion = 'v4';
        }

        const { Subscription } = await api<{ Subscription: Subscription }>(
            createSubscription(
                {
                    Plans: subscriptionData.planIDs,
                    Currency: subscriptionData.currency,
                    Cycle: subscriptionData.cycle,
                    BillingAddress: subscriptionData.billingAddress,
                    VatId: subscriptionData.vatNumber,
                    ...{
                        Payment: subscriptionData.paymentToken,
                        Amount: subscriptionData.checkResult.AmountDue,
                        ...(subscriptionData.checkResult.Coupon?.Code
                            ? { Codes: [subscriptionData.checkResult.Coupon.Code] }
                            : undefined),
                    },
                },
                productParam,
                paymentsVersion,
                hasZipCodeValidation
            )
        );

        onPaymentSuccess?.();

        return Subscription;
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
    productParam,
    keyTransparencyActivation,
    hasZipCodeValidation,
}: {
    accountData: AccountData;
    api: Api;
    persistent: boolean;
    trusted: boolean;

    subscriptionData: SubscriptionData2 | undefined;
    productParam: ProductParam;
    keyTransparencyActivation: KeyTransparencyActivation;
    hasZipCodeValidation: boolean;
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
    if (subscriptionData) {
        // Perform the subscription first to prevent "locked user" while setting up keys.
        subscription = await handleSubscribeUser(api, subscriptionData, productParam, hasZipCodeValidation);
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
        subscription,
    };
};
