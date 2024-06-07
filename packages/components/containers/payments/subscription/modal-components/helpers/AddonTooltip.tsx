import { ReactNode } from 'react';

import { c } from 'ttag';

import { AddonDescription } from '@proton/shared/lib/helpers/checkout';
import { isDomainAddon, isIpAddon, isMemberAddon } from '@proton/shared/lib/helpers/planIDs';
import { Currency } from '@proton/shared/lib/interfaces';

import { Info, Price } from '../../../../../components';

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
