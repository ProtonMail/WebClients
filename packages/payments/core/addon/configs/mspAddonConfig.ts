import { c } from 'ttag';

import { ADDON_PREFIXES } from '../../constants';
import type { AddonConfig } from '../interfaces';

export const MSP_ADDON_CONFIG: AddonConfig = {
    addonType: ADDON_PREFIXES.MSP,
    isPerMemberCapped: false,
    // Lowest so MSP transfers before member (see getTransferOrder): member only covers the space MSP doesn't
    // already grant. MSP is never rendered in the customizer, so this doesn't affect the UI.
    displayOrder: -1,
    featureLimit: { kind: 'synthetic', key: 'MaxMSP', grants: { MaxMSP: 1 } },
    transferStrategy: 'addonSeats',
    customizerCopy: {
        label: () => {
            return c('Addon').t`Managed Service Provider`;
        },
        tooltip: () =>
            c('Addon')
                .t`Organizations with the Managed Service Provider addon can create and manage subsidiary organizations.`,
    },
    title: () => c('Addon').t`Managed Service Provider`,
    dashboardTitle: () => c('Addon').t`Managed Service Provider`,
    addonCheckoutTitle: () => c('Addon').t`Managed Service Provider`,
};
