import type { Currency } from '@proton/payments';
import { getBuyProductConfig } from '@proton/payments/core/api/createPaymentSubscription';
import type { BillingAddress } from '@proton/payments/core/billing-address/billing-address';
import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';
import { auth } from '@proton/shared/lib/api/auth';
import { bornPrivate } from '@proton/shared/lib/api/born-private';
import { queryCreateUser } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';

import type { ReservedAccount } from '../../emailReservation/EmailReservationSignup';

const DONATION_PRODUCT_TYPE = 'born-private-donation';

export interface CreateDonationUserParams {
    reservedAccount: ReservedAccount;
    paymentToken: string;
    password: string;
    api: Api;
    productParam: ProductParam;
}

export const createDonationUser = async ({
    reservedAccount,
    paymentToken,
    password,
    api,
    productParam,
}: CreateDonationUserParams): Promise<void> => {
    const { username, payload, domain } = reservedAccount;

    const response = await srpVerify<Response>({
        api,
        credentials: { password },
        config: {
            output: 'raw',
            ...queryCreateUser(
                {
                    Type: CLIENT_TYPES.MAIL,
                    Username: username,
                    Payload: payload,
                    TokenPayment: paymentToken, // Payment token as verification
                    Domain: domain,
                },
                productParam
            ),
        },
    });

    await response.json();
};

export interface AuthenticateDonationUserParams {
    username: string;
    domain: string;
    password: string;
    api: Api;
    persistent?: boolean;
    silenceAuthErrors?: boolean;
}

export interface AuthenticateDonationUserResult {
    UID: string;
    AccessToken: string;
    LocalID: number;
}

/**
 * Authenticates the user and returns credentials for making authenticated API calls.
 * Call this after createDonationUserWithoutPayment; pass the result as `auth` to captureDonationPayment.
 * No session cookies are set, so the browser session is unchanged.
 */
export const authenticateDonationUser = async ({
    username,
    domain,
    password,
    api,
    persistent = false,
    silenceAuthErrors = false,
}: AuthenticateDonationUserParams): Promise<AuthenticateDonationUserResult> => {
    const userEmail = `${username}@${domain}`;

    // Authenticate the user
    const authResult = await srpAuth({
        api,
        credentials: { username: userEmail, password },
        config: { ...auth({ Username: userEmail }, persistent), silence: silenceAuthErrors },
    }).then((response): Promise<AuthResponse> => response.json());

    return authResult;
};

export interface CaptureDonationPaymentParams {
    paymentToken: string;
    amount: number;
    currency: Currency;
    billingAddress: BillingAddress;
    api: Api;
    auth: AuthenticateDonationUserResult;
    hasZipCodeValidation?: boolean;
}

/**
 * Calls payments/v5/products to start payment capture for a donation.
 * Must be called after the user is created and logged in; pass the result of loginDonationUser as `auth`.
 */
export const captureDonationPayment = async ({
    paymentToken,
    amount,
    currency,
    billingAddress,
    api,
    auth,
}: CaptureDonationPaymentParams): Promise<void> => {
    /**
     * We are buying a certain "quantity of donations". Think of it as "1 donation" == 1 USD. Since we potentially might
     * support currencies with 0 decimal places, we need to use divisor to correctly calculate the quantity.
     */
    const { divisor } = getCurrencyFormattingConfig(currency);
    const quantity = amount / divisor;

    const config = getBuyProductConfig(APPS.PROTONMAIL, {
        PaymentToken: paymentToken,
        ProductType: DONATION_PRODUCT_TYPE,
        Amount: amount,
        Currency: currency,
        BillingAddress: billingAddress,
        Quantity: quantity,
    });

    await api(withAuthHeaders(auth.UID, auth.AccessToken, config));
};

export interface SetBornPrivateDetailsParams {
    api: Api;
    auth: Pick<AuthenticateDonationUserResult, 'UID' | 'AccessToken'>;
    // auth: Pick<AuthenticateDonationUserResult, 'UID' | 'AccessToken'>;
    /** Parent email address; set as the recovery address for the reserved (child) account. */
    parentEmail: string;
    /** Generated activation key for the reserved account; sent to the backend. */
    activationKey: string;
}

/**
 * Sets the child account's recovery email to the parent's email and sends the generated activation key to the backend.
 * Must be called after payment capture, with the user authenticated.
 * Generates the voucher and sends it to the parent's email.
 * The activation key is encoded to base64 before sending.
 * Once complete the backend removes authentication.
 */
export const setBornPrivateDetails = async ({
    api,
    auth,
    parentEmail,
    activationKey,
}: SetBornPrivateDetailsParams): Promise<void> => {
    const activationKeyBase64 = new TextEncoder().encode(activationKey).toBase64();
    await api(
        withAuthHeaders(
            auth.UID,
            auth.AccessToken,
            bornPrivate({
                ParentEmail: parentEmail,
                ActivationKey: activationKeyBase64,
            })
        )
    );
};
