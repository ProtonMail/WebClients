import { c } from 'ttag';

import { Button } from '@proton/components/components';

import { useDealContext } from './DealContext';

const DealCTA = () => {
    const { deal, onSelectDeal, offer, currency } = useDealContext();
    const { popular } = deal;

    return (
        <Button
            color="norm"
            shape={popular ? 'solid' : 'outline'}
            className="mb1"
            fullWidth
            onClick={() => {
                onSelectDeal(offer, deal, currency);
            }}
        >
            {deal.getCTAContent?.() || c('specialoffer: Offers').t`Get the deal`}
        </Button>
    );
};

export default DealCTA;
