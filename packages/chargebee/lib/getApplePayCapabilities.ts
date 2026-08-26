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
 * applePayCapabilities() verifies the merchant against the top-level browsing context, not the calling frame, so from
 * this iframe the parent's merchant identifier verifies while its own returns applePayUnsupported.
 */
const getTopLevelHostname = () => new URL(getParentOrigin(window.location.origin)).hostname;

/**
 * ‼️ Please note that this function will return `false` if the subdomain wasn't configured on Stripe dashboard.
 *
 * Whether the Apple Pay button will work, asked before rendering it - rendering it to find out needs a payment intent,
 * so every Safari user would pay an extra POST tokens request. canMakePayments() alone over-promises (true with an
 * empty Wallet), so we ask the same questions Stripe.js gates its own button on.
 *
 * Iframe-only: the app's CSP forbids Apple's SDK. The app asks over postMessage.
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
