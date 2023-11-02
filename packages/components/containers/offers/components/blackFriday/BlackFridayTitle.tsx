import { c } from 'ttag';

import { isBlackFridayPeriod, isCyberWeekPeriod, isEndOfYearPeriod } from '../../helpers/offerPeriods';
import OfferTitle from '../shared/OfferTitle';

const BlackFridayTitle = () => {
    if (isBlackFridayPeriod()) {
        return <OfferTitle>{c('specialoffer: Title').t`Black Friday Sale`}</OfferTitle>;
    }

    if (isCyberWeekPeriod()) {
        return <OfferTitle>{c('specialoffer: Title').t`Cyber Week Sale`}</OfferTitle>;
    }

    if (isEndOfYearPeriod()) {
        return <OfferTitle>{c('specialoffer: Title').t`End of Year Sale`}</OfferTitle>;
    }

    return null;
};

export default BlackFridayTitle;
