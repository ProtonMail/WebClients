import { c } from 'ttag';

import { Toggle } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { ToggleProps } from '@proton/components/components/toggle/Toggle';
import { CYCLE, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

interface VPNPassUpsellToggleProps extends Omit<ToggleProps, 'ref'> {
    currency: Currency;
    cycle: CYCLE;
}

const VPNPassUpsellToggle = ({ currency, cycle, ...rest }: VPNPassUpsellToggleProps) => {
    const price = getSimplePriceString(currency, 100, '');
    const plan = `${PASS_SHORT_APP_NAME} Plus`;
    return (
        <>
            <Toggle id="toggle-upsell-pass" className="mx-1" {...rest} />
            <label htmlFor="toggle-upsell-pass" className="flex-item-fluid text-sm">
                {cycle === CYCLE.MONTHLY
                    ? c('bf2023: Action').t`Add ${plan} to your plan by subscribing to 15 months`
                    : c('bf2023: Action').t`Add ${plan} for ${price} per month`}
            </label>
        </>
    );
};

export default VPNPassUpsellToggle;
