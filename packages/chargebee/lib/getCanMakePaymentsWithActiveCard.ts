/**
 * What's going on, you may ask. Isn't regular ApplePaySession.canMakePayments() enough? What about Chargebee's
 * applePayHandler.canMakePayments() as described in their docs
 * https://www.chargebee.com/checkout-portal-docs/payment-handler-api-ref.html#wallet-based-payments? And what about
 * simply trying to render the apple pay button instead of this strange exercise?
 *
 * Well, ApplePaySession.canMakePayments() and ApplePaySession.canMakePaymentsWithActiveCard(merchantID) can return
 * different results in some cases. For example, canMakePayments() might return true while
 * canMakePaymentsWithActiveCard() returns false. canMakePaymentsWithActiveCard() is stricter than canMakePayments().
 * Examples that I've seen:
 * - If user's Apple Wallet doesn't have any cards, canMakePayments() returns true, but canMakePaymentsWithActiveCard()
 *   returns false.
 * - If the lid of macbook is closed and the computer is used with the external screen, then TouchID button might be
 *   unavailable, depending on the external keyboard model. In this case, biometry isn't available, and
 *   canMakePaymentsWithActiveCard() returns false while canMakePayments() returns true.
 *
 * There can be other cases, but what really matter is why do I care about canMakePaymentsWithActiveCard() function?
 * That's because Chargebee.js loads Stripe.js which uses canMakePaymentsWithActiveCard() as one of the last checks.
 * Before the Apple Pay button can be rendered.
 *
 * So this function emulates what Stripe.js does internally. Unfortunately, canMakePaymentsWithActiveCard() requires
 * merchantID parameter. And unfortunately, we don't have the merchantID in this case, because it's automatically
 * created by Stripe when a certain domain is whitelisted. The domain must be whitelisted here:
 * https://dashboard.stripe.com/test/settings/payment_method_domains. I observed that the format of merchantID is
 * "merchant.{domain}.{stripeAccountId}.stripe". For example,
 * "merchant.account-api.local.proton.black.acct_15kbbgKpW9DKy5hn.stripe". Can it change any time? I theory, yes. The
 * implementation of this function is a bet on the internal inertia of Stripe. There shouldn't be a reason to change it
 * often, especially given that the same reconstruction format is hardcoded in Stripe.js. Any change in the format will
 * require a migration on Stripe's side.
 *
 * Finally, what about simply trying to render the apple pay button instead? The thing is, that will require creation of
 * payment intent. So effectively each Safari user will have to run additional POST tokens request even if they don't
 * care for Apple Pay and want to use credit card or paypal instead. This is long, and also wasteful.
 *
 * At some point I considered using the undocumented API of Chargebee.js so it would trigger the function in Stripe.js
 * that would call canMakePaymentsWithActiveCard(). However, this option didn't work because one of the internal
 * function calls in Chargebee.js sends an API request to CB servers to fetch the stripe account ID, the one hardcoded
 * below. The request requires a Bearer token for authnetication, and the token is... Payment Intent ID.
 * So it's not even possible to request the Stripe account ID without creating the payment intent first.
 *
 * Speaking about Stripe Account ID. This is the same for Test mode and Production mode in Stripe. And this shouldn't
 * really rotate unless we really create a new Stripe account. This isn't a private information either, because any user
 * can inspect the API calls and find it.
 *
 * Just for the sake of documenting it, here is the approach that uses the undocumented Chargebee.js API and *fails*
 * because the Bearer token isn't available:
 *
 * async function canUseApplePay() {
 *     try {
 *         // the param is supposed to be the proper payment intent, and this is just a stub.
 *         const gatewayHandler = await applePayHandler.getGatewayHandler({
 *             payment_method_type: 'apple_pay',
 *             gateway: 'stripe',
 *         });
 *         await Promise.all([
 *             gatewayHandler.loadStripeJS(),
 *             // this function needs the Bearer token, which is the Payment Intent ID.
 *             gatewayHandler.preloadConfig(),
 *         ]);
 *
 *         gatewayHandler.createStripeInstance();
 *
 *         // that's Stripe.js PaymentRequest object
 *         const paymentRequest = gatewayHandler.setupPaymentRequest();
 *
 *         // https://docs.stripe.com/js/payment_request/can_make_payment
 *         const canMakePayment = await paymentRequest.canMakePayment();
 *
 *         return canMakePayment;
 *     } catch (error) {
 *         console.warn(error);
 *         return false;
 *     }
 * }
 *
 * And very careful reader might ask, why do I keep this function in the Chargebee package? Can it be simply called
 * from the main application? Unfortunately, no. The result of canMakePaymentsWithActiveCard() depends on the current
 * domain - even if the merchantID input remains the same. So technically, we should call this function twice:
 * once in the context of main app, and the second time in the context of the Chargebee iframe wrapper. This is because
 * Apple Pay and Stripe require whitelisting both domains if iframe is used.
 */
export async function getCanMakePaymentsWithActiveCard(): Promise<boolean> {
    const STRIPE_ACCOUNT_ID = 'acct_15kbbgKpW9DKy5hn';
    const domainParts = [window.location.hostname, STRIPE_ACCOUNT_ID];

    const merchantIdentifier = 'merchant.'.concat(domainParts.join('.'), '.stripe');

    const ApplePaySession = (window as any).ApplePaySession;
    if (!ApplePaySession) {
        return false;
    }

    try {
        const result =
            ApplePaySession.canMakePayments() &&
            (await ApplePaySession.canMakePaymentsWithActiveCard?.(merchantIdentifier));

        return result;
    } catch (error) {
        return false;
    }
}
