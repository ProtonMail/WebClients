import { getParentOrigin } from './get-parent-origin';
import { getCanMakePaymentsWithActiveCard } from './getCanMakePaymentsWithActiveCard';
import { getMerchantIdentifier } from './getMerchantIdentifier';
import { loadApplePaySdk } from './loadApplePaySdk';

/**
 * From https://developer.apple.com/documentation/applepayontheweb/paymentcredentialstatus
 */
type PaymentCredentialStatus =
    | 'paymentCredentialsAvailable'
    | 'paymentCredentialStatusUnknown'
    | 'paymentCredentialsUnavailable'
    | 'applePayUnsupported';

const SHOWS_APPLE_PAY_BUTTON: PaymentCredentialStatus[] = [
    'paymentCredentialsAvailable',
    'paymentCredentialStatusUnknown',
];

/**
 * applePayCapabilities() verifies the merchant against the top-level browsing context, not the calling frame: from
 * inside the account-api iframe the parent's merchant.account.proton.me identifier verifies while the iframe's own
 * merchant.account-api.proton.me returns applePayUnsupported. The legacy canMakePaymentsWithActiveCard() accepts
 * either, hence the two different hostnames.
 *
 * getParentOrigin inverts the getApiSubdomainUrl transform that built the iframe src, and is a no-op without the -api
 * label, so this is correct in the iframe and in the main app alike.
 */
const getTopLevelHostname = () => new URL(getParentOrigin(window.location.origin)).hostname;

/**
 * Answers whether the Apple Pay button will actually work, before we commit to rendering it.
 *
 * canMakePayments() alone over-promises: it returns true with an empty Wallet, or when biometry is unavailable.
 * Chargebee.js loads Stripe.js, which gates the button on the stricter
 * canMakePaymentsWithActiveCard(), so we ask the same questions Stripe.js does rather than trust canMakePayments().
 *
 * Rendering the button and seeing what happens isn't an option: that needs a payment intent, so every Safari user would
 * pay for an extra POST tokens request even when they intend to use a card or PayPal.
 *
 * It lives in this package because both answers depend on the calling domain, so they have to be asked from inside the
 * Chargebee iframe as well as from the app.
 *
 * Outside Safari there is no ApplePaySession until Apple's SDK defines one, so the load has to come first or every
 * answer here is a reflexive false.
 */
export async function getApplePayCapabilities(): Promise<boolean> {
    await loadApplePaySdk();

    const applePaySession = (window as any).ApplePaySession;
    if (!applePaySession) {
        return false;
    }

    try {
        if (!applePaySession.canMakePayments()) {
            return false;
        }
        const merchantIdentifier = getMerchantIdentifier(getTopLevelHostname());

        const capabilities: { paymentCredentialStatus: PaymentCredentialStatus } | undefined =
            await applePaySession.applePayCapabilities?.(merchantIdentifier);

        if (!capabilities) {
            return await getCanMakePaymentsWithActiveCard();
        }

        return SHOWS_APPLE_PAY_BUTTON.includes(capabilities.paymentCredentialStatus);
    } catch (error) {
        return false;
    }
}
