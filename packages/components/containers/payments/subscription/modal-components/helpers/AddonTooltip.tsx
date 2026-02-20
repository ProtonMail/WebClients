import type { ReactNode } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Price from '@proton/components/components/price/Price';
import {
    type ADDON_NAMES,
    type Currency,
    isDomainAddon,
    isIpAddon,
    isLumoAddon,
    isMemberAddon,
} from '@proton/payments';

export const AddonTooltip = ({
    addonName,
    pricePerAddon,
    currency,
}: {
    addonName: ADDON_NAMES;
    pricePerAddon: number;
    currency: Currency;
}) => {
    const price = (
        <Price currency={currency} key="price">
            {pricePerAddon}
        </Price>
    );

    let text: ReactNode;
    switch (true) {
        case isDomainAddon(addonName):
            text = c('Addon').jt`${price} per domain`;
            break;
        case isMemberAddon(addonName):
            text = c('Addon').jt`${price} per user`;
            break;
        case isIpAddon(addonName):
            text = c('Addon').jt`${price} per dedicated server`;
            break;
        case isLumoAddon(addonName):
            text = c('Addon').jt`${price} per seat`;
            break;
        default:
            return null;
    }

    return <Info title={text} className="ml-2" />;
};
