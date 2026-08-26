import { getMerchantIdentifier } from './getMerchantIdentifier';

/**
 * ‼️ Please note that this function will return `false` if the subdomain wasn't configured on Stripe dashboard.
 *
 * The check as it was before the ApplePayCapabilities flag; getApplePayCapabilities falls back to it whenever
 * applePayCapabilities() is missing, which is Safari, where ApplePaySession is native and Apple's SDK never loads.
 * Uses the current hostname, unlike getApplePayCapabilities' top-level one: applePayCapabilities() rejects the -api
 * identifier, this one has always accepted it.
 */
export async function getCanMakePaymentsWithActiveCard(): Promise<boolean> {
    const applePaySession = (window as any).ApplePaySession;
    // Apple's SDK defines ApplePaySession outside Safari too, so the method has to be there for the answer to mean
    // anything.
    if (typeof applePaySession?.canMakePaymentsWithActiveCard !== 'function') {
        return false;
    }

    try {
        const merchantIdentifier = getMerchantIdentifier(window.location.hostname);

        return (
            applePaySession.canMakePayments() &&
            (await applePaySession.canMakePaymentsWithActiveCard(merchantIdentifier))
        );
    } catch (error) {
        return false;
    }
}
