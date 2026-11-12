import { getAddonConfigByName } from '@proton/payments/core/addon/addons';
import type { ADDON_NAMES } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import { getSimplePriceString } from '@proton/payments/core/price-format';

import Info from '../../../../../components/link/Info';

export const AddonTooltip = ({
    addonName,
    pricePerAddon,
    currency,
}: {
    addonName: ADDON_NAMES;
    pricePerAddon: number;
    currency: Currency;
}) => {
    const renderLabel = getAddonConfigByName(addonName)?.tooltipLabel;
    if (!renderLabel) {
        return null;
    }

    const price = getSimplePriceString(currency, pricePerAddon);

    return <Info title={renderLabel(price)} className="ml-2" />;
};
