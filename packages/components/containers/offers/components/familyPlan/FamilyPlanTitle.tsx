import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';

import OfferTitle from '../shared/OfferTitle';

const FamilyPlanTitle = () => {
    const planName = PLAN_NAMES[PLANS.FAMILY];

    return (
        <>
            <OfferTitle>{c('familyOffer_2023:Title').t`Introducing ${planName}`}</OfferTitle>
            <p className="text-center">{c('familyOffer_2023:Info').t`Online privacy, for your whole family`}</p>
        </>
    );
};

export default FamilyPlanTitle;
