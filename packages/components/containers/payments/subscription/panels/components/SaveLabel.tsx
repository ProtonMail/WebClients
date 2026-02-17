import { c } from 'ttag';

import type { CYCLE, Currency, PLANS } from '@proton/payments';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { getPlanToCheck } from '@proton/payments/ui/context/helpers';

interface SaveLabelProps {
    plan: PLANS | undefined;
    cycle: CYCLE | undefined;
    currency: Currency;
}

const SaveLabel = ({ plan, cycle, currency }: SaveLabelProps) => {
    const payments = usePayments();

    if (!plan || !cycle) {
        return null;
    }

    const price = payments.getPriceOrFallback(getPlanToCheck({ planIDs: { [plan]: 1 }, cycle, currency }));

    if (!price.checkoutUi.discountPercent) {
        return null;
    }

    return (
        <span className="UpsellPanelV2-save-label text-uppercase font-semibold text-xs rounded ml-1 py-0.5 px-1">
            {c('upsell panel').t`Save ${price.checkoutUi.discountPercent}%`}
        </span>
    );
};

export default SaveLabel;
