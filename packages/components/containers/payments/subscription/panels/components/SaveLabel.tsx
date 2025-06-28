import { c } from 'ttag';

import { type CYCLE, type Currency, type PLANS } from '@proton/payments';
import { getPlanToCheck, usePaymentsPreloaded } from '@proton/payments/ui';

interface SaveLabelProps {
    plan: PLANS | undefined;
    cycle: CYCLE | undefined;
    currency: Currency;
}

const SaveLabel = ({ plan, cycle, currency }: SaveLabelProps) => {
    const payments = usePaymentsPreloaded();

    if (!plan || !cycle) {
        return null;
    }

    const price = payments.getPriceOrFallback(getPlanToCheck({ planIDs: { [plan]: 1 }, cycle, currency }));

    if (!price.uiData.discountPercent) {
        return null;
    }

    return (
        <span className="UpsellPanelV2-save-label text-uppercase font-semibold text-xs rounded ml-1 py-0.5 px-1">
            {c('upsell panel').t`Save ${price.uiData.discountPercent}%`}
        </span>
    );
};

export default SaveLabel;
