import { c, msgid } from 'ttag';

import { CYCLE } from '../../../core/constants';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const BILLING_CYCLE_LINE_ITEM_TYPE = 'billingCycle' as const;

export interface BillingCycleLineItem
    extends BaseLineItem<typeof BILLING_CYCLE_LINE_ITEM_TYPE>, ReturnType<typeof formatBillingCycle> {}

function getCycleShortText(cycle: CYCLE, { isLifetime }: { isLifetime: boolean }) {
    if (isLifetime) {
        return c('Billing cycle option').t`Lifetime`;
    }

    if (!cycle) {
        return '';
    }
    if (cycle === CYCLE.MONTHLY) {
        return c('Billing cycle option').t`Monthly`;
    }
    if (cycle === CYCLE.YEARLY) {
        return c('Billing cycle option').t`Yearly`;
    }
    return c('Plans').ngettext(msgid`${cycle} month`, `${cycle} months`, cycle);
}

function getYears(n: number) {
    return c('Billing cycle option').ngettext(msgid`${n} year`, `${n} years`, n);
}

function getMonths(n: number) {
    return c('Billing cycle option').ngettext(msgid`${n} month`, `${n} months`, n);
}

function getCycleNormalText(cycle: CYCLE, { isLifetime }: { isLifetime: boolean }): string | null {
    if (isLifetime) {
        return c('Billing cycle option').t`Lifetime access`;
    }

    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('Billing cycle option').t`Billed monthly`;
        case CYCLE.YEARLY:
            return getYears(1);
        case CYCLE.TWO_YEARS:
            return getYears(2);
        default:
            return getMonths(cycle);
    }
}

function formatBillingCycle(ctx: HeadlessCheckoutContextInner) {
    const { cycle, isPaidPlan, isLifetime, planIDs } = ctx;

    return {
        cycle,
        visible: isPaidPlan,
        shortText: getCycleShortText(cycle, { isLifetime }),
        normalText: getCycleNormalText(cycle, { isLifetime }),
        planIDs,
    };
}

export function createBillingCycleItem(ctx: HeadlessCheckoutContextInner): BillingCycleLineItem {
    return {
        type: BILLING_CYCLE_LINE_ITEM_TYPE,
        ...formatBillingCycle(ctx),
    };
}
