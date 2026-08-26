/**
 * Stripe creates the merchant identifier itself when a domain is registered
 * (https://dashboard.stripe.com/test/settings/payment_method_domains) and never hands it back, so we reconstruct the
 * "merchant.{hostname}.{stripeAccountId}.stripe" format Stripe.js hardcodes. A bet on Stripe's inertia: changing the
 * format would force a migration on their side. The account ID is the same in test and live mode, and is public - any
 * user can read it off the API calls.
 */
export function getMerchantIdentifier(hostname: string): string {
    const STRIPE_ACCOUNT_ID = 'acct_15kbbgKpW9DKy5hn';

    return ['merchant', hostname, STRIPE_ACCOUNT_ID, 'stripe'].join('.');
}
