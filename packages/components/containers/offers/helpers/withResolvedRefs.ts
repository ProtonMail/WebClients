import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { OfferConfig } from '../interface';
import { getOfferProduct, getPlanRefName } from './getOfferProduct';
import type OfferSubscription from './offerSubscription';

/**
 * Resolves the tracking ref for an offer's deals, which encodes the plan the user is currently on and
 * the app they are in (`offer_26_sep_drive_plus_unlimited_mail_web`).
 *
 * Offer configurations are module-level constants evaluated once at import time, so they cannot know
 * either. They declare `getRef` instead, and each operation's `useOffer` hook calls this to fill in
 * the real value. Everything downstream then reads `deal.ref` as normal. Feature copy also varies by
 * product, but each consumer passes the product to `deal.features()` itself.
 *
 * Returns the config untouched when no deal uses `getRef`, so the object identity is stable for every
 * other offer in the codebase.
 */
export const withResolvedRefs = (
    config: OfferConfig,
    appName: APP_NAMES,
    pathname: string,
    offerSubscription?: OfferSubscription
): OfferConfig => {
    // Config doesn't have a deal with getRef so just return the config and use default ref
    if (!config.deals.some((deal) => deal.getRef)) {
        return config;
    }

    const product = getOfferProduct(appName, pathname);
    const currentPlan = getPlanRefName(offerSubscription);

    return {
        ...config,
        deals: config.deals.map((deal) => {
            if (!deal.getRef) {
                return deal;
            }

            // Add the correct app and plan specific ref. Feature copy is product-specific too, but the
            // product is passed at the call site rather than bound here.
            return {
                ...deal,
                ref: deal.getRef(product, currentPlan),
            };
        }),
    };
};
