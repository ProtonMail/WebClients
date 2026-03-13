import { c } from 'ttag';

import { TaxInclusive } from '../../../core/subscription/constants';
import type { SubscriptionEstimation } from '../../../core/subscription/interface';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const VAT_REVERSE_CHARGE_LINE_ITEM_TYPE = 'vatReverseCharge' as const;

export interface VatReverseChargeLineItem
    extends BaseLineItem<typeof VAT_REVERSE_CHARGE_LINE_ITEM_TYPE>, ReturnType<typeof formatVatReverseCharge> {}

export function isVatReverseChargeApplicable(checkResult: SubscriptionEstimation) {
    return checkResult.TaxInclusive === TaxInclusive.EXCLUSIVE && (checkResult.Taxes?.length ?? 0) === 0;
}

export function getVatReverseChargeText() {
    return c('Payments').t`VAT reverse charge mechanism applies.`;
}

function formatVatReverseCharge(ctx: HeadlessCheckoutContextInner) {
    const { checkResult } = ctx;

    return {
        text: getVatReverseChargeText(),
        visible: isVatReverseChargeApplicable(checkResult),
    };
}

export function createVatReverseChargeItem(ctx: HeadlessCheckoutContextInner): VatReverseChargeLineItem {
    return {
        type: VAT_REVERSE_CHARGE_LINE_ITEM_TYPE,
        ...formatVatReverseCharge(ctx),
    };
}
