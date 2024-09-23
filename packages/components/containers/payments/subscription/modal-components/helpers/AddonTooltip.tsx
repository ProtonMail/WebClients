import type { ReactNode } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Price from '@proton/components/components/price/Price';
import { isDomainAddon, isIpAddon, isMemberAddon } from '@proton/shared/lib/helpers/addons';
import type { AddonDescription } from '@proton/shared/lib/helpers/checkout';
import type { Currency } from '@proton/shared/lib/interfaces';

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
    if (isDomainAddon(addon.name)) {
        text = c('Addon').jt`${price} per domain`;
    } else if (isMemberAddon(addon.name)) {
        text = c('Addon').jt`${price} per user`;
    } else if (isIpAddon(addon.name)) {
        text = c('Addon').jt`${price} per dedicated server`;
    } else {
        return null;
    }

    return <Info title={text} className="ml-2" />;
};
