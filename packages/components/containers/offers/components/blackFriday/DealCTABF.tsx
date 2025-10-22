import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useDealContext } from '../shared/deal/DealContext';

const DealCTABF = () => {
    const { deal, onSelectDeal, offer, currency } = useDealContext();
    const { popular, buttonSize } = deal;

    return (
        <Button
            color="norm"
            shape={popular === 1 ? 'solid' : 'outline'}
            className="mb-4 offer-cta text-semibold"
            size={buttonSize || 'medium'}
            fullWidth
            onClick={() => {
                onSelectDeal(offer, deal, currency);
            }}
        >
            {deal.getCTAContent?.() || c('specialoffer: Offers').t`Get the deal`}
        </Button>
    );
};

export default DealCTABF;
