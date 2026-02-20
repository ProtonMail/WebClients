import type { ReactNode } from 'react';

import {
    type CheckoutLineItem,
    type GetHeadlessCheckoutParams,
    type HeadlessCheckout,
    getHeadlessCheckout,
} from './get-headless-checkout';
import { ADDONS_LINE_ITEM_TYPE } from './items/addons';
import { AMOUNT_DUE_LINE_ITEM_TYPE } from './items/amount-due';
import { BILLING_CYCLE_LINE_ITEM_TYPE } from './items/billing-cycle';
import { COUPON_LINE_ITEM_TYPE } from './items/coupon';
import { CREDIT_LINE_ITEM_TYPE } from './items/credit';
import { DISCOUNT_LINE_ITEM_TYPE } from './items/discount';
import { GIFT_LINE_ITEM_TYPE } from './items/gift';
import { MEMBERS_LINE_ITEM_TYPE } from './items/members';
import { NEXT_BILLING_LINE_ITEM_TYPE } from './items/next-billing';
import { PLAN_AMOUNT_LINE_ITEM_TYPE } from './items/plan-amount';
import { PLAN_AMOUNT_WITH_DISCOUNT_LINE_ITEM_TYPE } from './items/plan-amount-with-discount';
import { PRORATION_LINE_ITEM_TYPE } from './items/proration';
import { RENEWAL_NOTICE_LINE_ITEM_TYPE } from './items/renewal-notice';
import { TAX_EXCLUSIVE_LINE_ITEM_TYPE } from './items/tax-exclusive';
import { TAX_INCLUSIVE_LINE_ITEM_TYPE } from './items/tax-inclusive';
import { UNUSED_CREDIT_LINE_ITEM_TYPE } from './items/unused-credit';

export type CheckoutView = ReturnType<typeof createCheckoutView>;

/**
 * A mapped type that requires a renderer function for every CheckoutLineItem type.
 * TypeScript will error if any key is missing, enforcing exhaustive handling.
 *
 * Consumers who intentionally skip certain item types should return `null`.
 */
export type CheckoutItemRendererMap = {
    [K in CheckoutLineItem['type']]: (item: Extract<CheckoutLineItem, { type: K }>) => ReactNode;
};

export const defaultCheckoutItemOrder: readonly CheckoutLineItem['type'][] = [
    BILLING_CYCLE_LINE_ITEM_TYPE,
    MEMBERS_LINE_ITEM_TYPE,
    ADDONS_LINE_ITEM_TYPE,
    PLAN_AMOUNT_LINE_ITEM_TYPE,
    COUPON_LINE_ITEM_TYPE,
    DISCOUNT_LINE_ITEM_TYPE,
    PLAN_AMOUNT_WITH_DISCOUNT_LINE_ITEM_TYPE,
    PRORATION_LINE_ITEM_TYPE,
    UNUSED_CREDIT_LINE_ITEM_TYPE,
    CREDIT_LINE_ITEM_TYPE,
    GIFT_LINE_ITEM_TYPE,
    TAX_EXCLUSIVE_LINE_ITEM_TYPE,
    NEXT_BILLING_LINE_ITEM_TYPE,
    AMOUNT_DUE_LINE_ITEM_TYPE,
    TAX_INCLUSIVE_LINE_ITEM_TYPE,
    RENEWAL_NOTICE_LINE_ITEM_TYPE,
];

export function createCheckoutViewFromHeadlessCheckout(
    checkoutData: HeadlessCheckout,
    renderers: CheckoutItemRendererMap | ((headless: HeadlessCheckout) => CheckoutItemRendererMap)
) {
    const resolvedRenderers = typeof renderers === 'function' ? renderers(checkoutData) : renderers;

    return {
        /** Raw headless checkout data (plan info, items, flags, etc.) */
        checkoutData,
        getItem: checkoutData.getItem,

        /**
         * Render a single checkout line item by type.
         *
         * Returns `null` when the item is not visible (unless `ignoreVisibility` is set).
         */
        render<T extends CheckoutLineItem['type']>(type: T, options?: { ignoreVisibility?: boolean }): ReactNode {
            const item = checkoutData.getItem(type);
            if (!item.visible && !options?.ignoreVisibility) {
                return null;
            }

            const renderer = resolvedRenderers[type] as (item: CheckoutLineItem) => ReactNode;
            return renderer(item);
        },

        /**
         * Return all visible line items, optionally excluding specific types.
         * Useful for rendering the "body" of the checkout while handling
         * excluded items (e.g. amount-due, discount) separately via `render()`.
         */
        getVisibleItems(options?: { exclude?: CheckoutLineItem['type'][] }): CheckoutLineItem[] {
            return defaultCheckoutItemOrder.reduce<CheckoutLineItem[]>((result, type) => {
                if (options?.exclude?.includes(type)) {
                    return result;
                }
                const item = checkoutData.items[type];
                if (item.visible) {
                    result.push(item);
                }
                return result;
            }, []);
        },
    };
}

/**
 * Create a checkout view that combines headless checkout data with renderers.
 *
 * @param params - Parameters forwarded to `getHeadlessCheckout`
 * @param renderers - Either a renderer map, or a callback that receives the
 *   `HeadlessCheckout` instance and returns a renderer map. Use the callback
 *   form when renderers need to reference headless data (e.g. `headless.isLifetime`).
 */
export function createCheckoutView(
    params: GetHeadlessCheckoutParams,
    renderers: CheckoutItemRendererMap | ((headless: HeadlessCheckout) => CheckoutItemRendererMap)
) {
    const headless = getHeadlessCheckout(params);

    return createCheckoutViewFromHeadlessCheckout(headless, renderers);
}
