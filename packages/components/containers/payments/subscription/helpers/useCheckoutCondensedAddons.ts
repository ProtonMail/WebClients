import { useFlagsStatus } from '@proton/unleash/proxy';
import { useVariant } from '@proton/unleash/useVariant';

import { type CheckoutCondensedAddonsParams, getCheckoutCondensedAddons } from './getCheckoutCondensedAddons';

export const useCheckoutCondensedAddons = (args: Omit<CheckoutCondensedAddonsParams, 'flagsReady' | 'variant'>) => {
    const { flagsReady } = useFlagsStatus();
    const variant = useVariant('CheckoutCondensedAddons');

    return getCheckoutCondensedAddons({ ...args, flagsReady, variant }) === 'condensed';
};
