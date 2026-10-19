import type { GuardError } from '@proton/payments/core/subscription/guard';

import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import type { BaseLineItem } from './base-line-item';

export const GUARD_LINE_ITEM_TYPE = 'guard' as const;

export interface GuardLineItem extends BaseLineItem<typeof GUARD_LINE_ITEM_TYPE> {
    guards: GuardError[];
}

export function createGuardItem(ctx: HeadlessCheckoutContextInner): GuardLineItem {
    const guards = ctx.checkResult.GuardResult ?? [];

    return {
        type: GUARD_LINE_ITEM_TYPE,
        guards,
        visible: guards.length > 0,
    };
}
