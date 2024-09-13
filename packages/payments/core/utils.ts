import { type PaymentsVersion } from '@proton/shared/lib/api/payments';
import {
    BillingPlatform,
    ChargebeeEnabled,
    type ChargebeeUserExists,
    type Subscription,
    type User,
} from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES } from './constants';
import { MethodStorage } from './constants';
import { type SavedPaymentMethod, type TokenPaymentMethod, type V5PaymentToken } from './interface';

export const toV5PaymentToken = (PaymentToken: string): V5PaymentToken => {
    return {
        PaymentToken,
        v: 5,
    };
};

export function sanitizeV5PaymentToken(data: V5PaymentToken): V5PaymentToken {
    const sanitizedData: V5PaymentToken = {
        v: 5,
        PaymentToken: data.PaymentToken,
    };

    return sanitizedData;
}

export function v5PaymentTokenToLegacyPaymentToken(data: V5PaymentToken): TokenPaymentMethod {
    return {
        Payment: {
            Type: PAYMENT_METHOD_TYPES.TOKEN,
            Details: {
                Token: data.PaymentToken,
            },
        },
    };
}

export function canUseChargebee(chargebeeEnabled: ChargebeeEnabled): boolean {
    return (
        chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_ALLOWED ||
        chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED
    );
}

export function isOnSessionMigration(
    chargebeeUser: ChargebeeEnabled,
    billingPlatform: BillingPlatform | undefined
): boolean {
    return chargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED && billingPlatform === BillingPlatform.Proton;
}

export function isSplittedUser(
    chargebeeUser: ChargebeeEnabled,
    chargebeeUserExists: ChargebeeUserExists | undefined,
    billingPlatform: BillingPlatform | undefined
): boolean {
    return isOnSessionMigration(chargebeeUser, billingPlatform) && !!chargebeeUserExists;
}

export function onSessionMigrationChargebeeStatus(
    user: User,
    subscription: Subscription | undefined
): ChargebeeEnabled {
    return isOnSessionMigration(user.ChargebeeUser, subscription?.BillingPlatform)
        ? ChargebeeEnabled.INHOUSE_FORCED
        : user.ChargebeeUser;
}

export function onSessionMigrationPaymentsVersion(user: User, subscription: Subscription | undefined): PaymentsVersion {
    return onSessionMigrationChargebeeStatus(user, subscription) === ChargebeeEnabled.INHOUSE_FORCED ? 'v4' : 'v5';
}

export function paymentMethodPaymentsVersion(method?: SavedPaymentMethod): PaymentsVersion {
    return method?.External === MethodStorage.EXTERNAL ? 'v5' : 'v4';
}
