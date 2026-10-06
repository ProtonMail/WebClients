import type { LumoAgentItem } from './types';
import { ConfirmStatus } from './types';

export const findPendingConfirm = (items: LumoAgentItem[]) =>
    items.find((item) => item.kind === 'confirm' && item.status === ConfirmStatus.PENDING);

/** Awaiting a user decision on a confirm card does not count as generating. */
export const isAgentGenerating = (items: LumoAgentItem[], isBusy: boolean) => isBusy && !findPendingConfirm(items);
