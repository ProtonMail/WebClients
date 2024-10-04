import { c } from 'ttag';

// import { isBlackFridayPeriod, isCyberWeekPeriod } from '../../helpers/offerPeriods';
import OfferTitle from '../shared/OfferTitle';

const BlackFridayTitle = () => {
    /*if (isBlackFridayPeriod()) {
        return <OfferTitle>{c('specialoffer: Title').t`Black Friday Sale`}</OfferTitle>;
    }

    if (isCyberWeekPeriod()) {
        return <OfferTitle>{c('specialoffer: Title').t`Cyber Week Sale`}</OfferTitle>;
    }*/

    return <OfferTitle>{c('specialoffer: Title').t`Black Friday Sale`}</OfferTitle>;
};

export default BlackFridayTitle;
