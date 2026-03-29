import { canAddMeetAddon } from '@proton/payments/core/subscription/helpers';
import type { FreeSubscription, Subscription } from '@proton/payments/index';

export function showMeetAddonCustomizer({ subscription }: { subscription: Subscription | FreeSubscription }): boolean {
    return canAddMeetAddon(subscription);
}
