import type { FullBillingAddressFlat } from '@proton/payments/core/billing-address/billing-address';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import type { SignupParameters2 } from '../single-signup-v2/interface';

/**
 * Sales-led organization provisioning.
 *
 * 1. An agent sets up the deal in the Admin Panel, which issues a single-use business signup link with a
 *    `provisioningToken` hash param.
 * 2. The link carries the plan side of the deal (plan, cycle, currency, addons, coupon) as regular signup
 *    query params, parsed like any other signup.
 * 3. The token lookup ({@link resolveProvisioning}) returns the rest: organization, admin, billing and
 *    payment terms.
 * 4. There is no redeem endpoint: the token goes as `ProvisioningToken` on the regular
 *    `payments/v5/subscription` call, and the backend redeems it in that request.
 */

// TYPES

export enum ProvisioningPaymentMethod {
    BankTransfer = 'BankTransfer',
    Card = 'Card',
}

/** The token lookup response. */
export interface SignupProvisioning {
    OrganizationName: string;
    AdminDisplayName: string;
    AdminEmail: string;
    BillingAddress: FullBillingAddressFlat;
    InvoiceEmail: string;
    Taxable: boolean;
    PaymentMethod: ProvisioningPaymentMethod;
    /** Net payment terms in days. 0 means due on receipt. */
    PaymentTermsDays: number;
}

/** The signup params the link may carry that overlap with the token lookup. */
type UrlParams = Pick<SignupParameters2, 'orgName' | 'firstName' | 'lastName' | 'vatNumber' | 'streetAddress' | 'city'>;

// LINK

/** Reads the provisioning token from the link's hash, e.g. `/mail/signup/business?plan=…#provisioningToken=…`. */
export const getProvisioningToken = (hash: string) =>
    new URLSearchParams(hash.slice(1)).get('provisioningToken') || undefined;

// TOKEN LOOKUP

/** Thrown when the link is unknown, expired, revoked or already redeemed. */
export class InvalidProvisioningLinkError extends Error {
    constructor() {
        super('Invalid provisioning link');
        this.name = 'InvalidProvisioningLinkError';
    }
}

/** Statuses the lookup returns for an unusable link. */
const INVALID_LINK_STATUSES = new Set<number>([HTTP_STATUS_CODE.NOT_FOUND, HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY]);

/** Unauthenticated, as the prospect has no account yet. */
const queryResolveProvisioning = (token: string) => ({
    method: 'get',
    // The token comes from the URL, so it is encoded to stay a single path segment.
    url: `core/v4/org-provisioning/${encodeURIComponent(token)}`,
});

/**
 * Fetches the deal behind a provisioning token.
 * @throws {InvalidProvisioningLinkError} when the link can no longer be used.
 * @throws the original API error for any other failure.
 */
export const resolveProvisioning = async (api: Api, token: string): Promise<SignupProvisioning> => {
    try {
        const { Provisioning } = await api<{ Provisioning: SignupProvisioning }>(queryResolveProvisioning(token));
        return Provisioning;
    } catch (error) {
        const { status } = getApiError(error);
        if (status !== undefined && INVALID_LINK_STATUSES.has(status)) {
            throw new InvalidProvisioningLinkError();
        }
        throw error;
    }
};

// DEAL ASSEMBLY

/**
 * Merges the link params into the lookup. A non-empty link param wins over the lookup value; every
 * other field (admin, country, state, postal code, invoice email, taxable, payment terms) comes from the lookup.
 */
const withUrlParams = (provisioning: SignupProvisioning, params: Partial<UrlParams>): SignupProvisioning => {
    const address = provisioning.BillingAddress;

    return {
        ...provisioning,
        OrganizationName: params.orgName || provisioning.OrganizationName,
        BillingAddress: {
            ...address,
            FirstName: params.firstName || address.FirstName,
            LastName: params.lastName || address.LastName,
            Address: params.streetAddress || address.Address,
            City: params.city || address.City,
            VatId: params.vatNumber || address.VatId,
        },
    };
};

/**
 * Splits the billing address into the `billingAddress` and `vatNumber` the check and subscription calls take.
 * The backend only redeems the token when both match its record, so they override the payment form.
 */
const getProvisionedBillingDetails = ({ BillingAddress }: SignupProvisioning) => {
    const { VatId, ...billingAddress } = BillingAddress;

    return {
        billingAddress: {
            ...billingAddress,
            // Payments rejects a blank State or ZipCode and expects null instead. Records created before the
            // Admin Panel sent null still carry blanks.
            State: billingAddress.State || null,
            ZipCode: billingAddress.ZipCode || null,
        },
        vatNumber: VatId || undefined,
    };
};

/**
 * Everything a provisioned signup needs beyond the plan, computed once. Its presence makes the signup
 * read-only: the prospect only sets a password, plus card details when paying by card.
 */
export interface ProvisionedDeal {
    /** Sent as `ProvisioningToken` on the subscription call to redeem the link. */
    token: string;
    /** The lookup, with the link params merged in. */
    details: SignupProvisioning;
    /** Ready for the payments check and subscription calls. */
    billingAddress: ReturnType<typeof getProvisionedBillingDetails>['billingAddress'];
    vatNumber: string | undefined;
    isBankTransfer: boolean;
}

export const getProvisionedDeal = ({
    token,
    provisioning,
    urlParams,
}: {
    token: string;
    provisioning: SignupProvisioning;
    urlParams: Partial<UrlParams>;
}): ProvisionedDeal => {
    const details = withUrlParams(provisioning, urlParams);
    const { billingAddress, vatNumber } = getProvisionedBillingDetails(details);

    return {
        token,
        details,
        billingAddress,
        vatNumber,
        isBankTransfer: details.PaymentMethod === ProvisioningPaymentMethod.BankTransfer,
    };
};
