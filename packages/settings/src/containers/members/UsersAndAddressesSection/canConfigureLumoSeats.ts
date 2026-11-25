import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import { getSubscriptionSupportingAddon } from '@proton/payments/core/plan/addons';
import type { Subscription } from '@proton/payments/core/subscription/interface';

// Without Lumo seats and without a subscription that can add them (e.g. Pass Basic, which has no Lumo
// add-on), "Add to your subscription" only opens a checkout with nothing to add.
export const canConfigureLumoSeats = ({
    maxLumo,
    subscriptions,
}: {
    maxLumo: number;
    subscriptions?: Subscription[];
}) =>
    maxLumo > 0 ||
    // An empty list means either a free organization, which can still buy a plan with Lumo ("Add to your
    // subscription" opens the plan selection), or a user who can't read the subscriptions, so we can't tell
    !subscriptions?.length ||
    !!getSubscriptionSupportingAddon(subscriptions, ADDON_PREFIXES.LUMO);
