import { c } from 'ttag';

import { Button } from '@proton/atoms/index';

import type { OfferProps } from '../../interface';

const Anniversary2025CTA = (props: OfferProps) => {
    const handleClick = () => {
        props.onSelectDeal(props.offer, props.offer.deals[0], props.currency);
    };
    return (
        <Button size="large" fullWidth color="norm" className="text-semibold gradient-highlight" onClick={handleClick}>
            {c('anniversary_2025').t`Get the deal`}
        </Button>
    );
};

export default Anniversary2025CTA;
