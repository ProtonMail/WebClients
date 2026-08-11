import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { OfferConfig } from '../interface';
import { getOfferProduct, getPlanRefName } from './getOfferProduct';
import type OfferSubscription from './offerSubscription';

/**
 * Resolves the runtime-dependent parts of an offer's deals: the tracking ref, which encodes the plan
 * the user is currently on and the app they are in (`offer_26_sep_drive_plus_unlimited_mail_web`), and
 * the feature copy, which varies by product.
 *
 * Offer configurations are module-level constants evaluated once at import time, so they cannot know
 * either. They declare `getRef` instead, and each operation's `useOffer` hook calls this to fill in
 * the real values. Everything downstream then reads `deal.ref` and `deal.features()` as normal.
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

            const { features } = deal;

            // Add the correct app and plan specific ref and correct product features
            return {
                ...deal,
                ref: deal.getRef(product, currentPlan),
                // Bind the product in, so the shared Deal.features signature stays argument-free.
                ...(features ? { features: () => features(product) } : {}),
            };
        }),
    };
};
