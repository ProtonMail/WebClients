import { PLANS } from '@proton/payments/core/constants';

import { getCheckoutRenewNoticeTextFromCheckResult, getSwitchTermsNoticeText } from '../../components/RenewalNotice';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const RENEWAL_NOTICE_LINE_ITEM_TYPE = 'renewalNotice' as const;

export interface RenewalNoticeLineItem
    extends BaseLineItem<typeof RENEWAL_NOTICE_LINE_ITEM_TYPE>, ReturnType<typeof formatRenewalNotice> {}

function formatRenewalNotice(ctx: HeadlessCheckoutContextInner) {
    const { checkResult, plansMap, planIDs, subscription, app, isPaidPlan, paymentForbiddenReason } = ctx;

    const renewalNotice = planIDs[PLANS.PASS_BASIC]
        ? getSwitchTermsNoticeText(app)
        : getCheckoutRenewNoticeTextFromCheckResult({
              checkResult,
              plansMap,
              planIDs,
              subscription,
              app,
          });

    const displayRenewNotice = isPaidPlan && !paymentForbiddenReason?.forbidden;

    return {
        content: renewalNotice,
        visible: displayRenewNotice,
    };
}

export function createRenewalNoticeItem(ctx: HeadlessCheckoutContextInner): RenewalNoticeLineItem {
    return {
        type: RENEWAL_NOTICE_LINE_ITEM_TYPE,
        ...formatRenewalNotice(ctx),
    };
}
