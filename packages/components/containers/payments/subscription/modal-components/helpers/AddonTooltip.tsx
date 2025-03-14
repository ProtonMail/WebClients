import type { ReactNode } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Price from '@proton/components/components/price/Price';
import { type Currency } from '@proton/payments';
import { isDomainAddon, isIpAddon, isLumoAddon, isMemberAddon } from '@proton/shared/lib/helpers/addons';
import type { AddonDescription } from '@proton/shared/lib/helpers/checkout';

export const AddonTooltip = ({
    addon,
    pricePerAddon,
    currency,
}: {
    addon: AddonDescription;
    pricePerAddon: number;
    currency: Currency;
}) => {
    const price = <Price currency={currency}>{pricePerAddon}</Price>;

    let text: ReactNode;
    switch (true) {
        case isDomainAddon(addon.name):
            text = c('Addon').jt`${price} per domain`;
            break;
        case isMemberAddon(addon.name):
            text = c('Addon').jt`${price} per user`;
            break;
        case isIpAddon(addon.name):
            text = c('Addon').jt`${price} per dedicated server`;
            break;
        case isLumoAddon(addon.name):
            text = c('Addon').jt`${price} per seat`;
            break;
        default:
            return null;
    }

    return <Info title={text} className="ml-2" />;
};
