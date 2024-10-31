/**
 * What is this? The BE now adds the coupon asynchronously to the subscription. So the client first receives
 * an event loop update with the new subscription without the coupon, and then another event loop update
 * 30s later with the coupon.
 *
 * To determine if a user is eligible for a BF offer it checks the coupon of the subscription. Since it's
 * updated without, it thinks the user is eligible for another offer.
 *
 * This is a temporary workaround that when a subscription happens with the bf offer coupon, we set
 * something temporarily in the app to identify that it has been used.
 */
export let usedBfOffer = false;

export const setUsedBfOffer = (value: boolean) => {
    usedBfOffer = value;
};
