import { c } from 'ttag';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const BASE_RENEW_AMOUNT_LINE_ITEM_TYPE = 'baseRenewAmount' as const;

export interface BaseRenewAmount
    extends BaseLineItem<typeof BASE_RENEW_AMOUNT_LINE_ITEM_TYPE>, ReturnType<typeof formatBaseRenewAmount> {}

function formatBaseRenewAmount(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, currency, isTrial } = ctx;

    return {
        baseRenewAmount: checkResult.BaseRenewAmount ?? 0,
        currency,
        label: c('Checkout row').t`Amount due after trial`,
        visible: isTrial,
    };
}

export function createBaseRenewAmountItem(ctx: HeadlessCheckoutContextInner): BaseRenewAmount {
    return {
        type: BASE_RENEW_AMOUNT_LINE_ITEM_TYPE,
        ...formatBaseRenewAmount(ctx),
    };
}
