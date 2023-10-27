import { c } from 'ttag';

import promotionExpired from './promotionExpired.svg';

const PromotionExpired = () => {
    return (
        <div className="h-full flex flex-column flex-justify-center flex-align-items-center bg-norm">
            <img src={promotionExpired} alt="" />
            <h1 className="text-bold text-2xl mb-2 mt-8">{c('Info').t`Promotion expired`}</h1>
            <div>{c('Info').t`This promotion link has expired.`}</div>
            <div>{c('Info').t`Stay tuned for future promotions.`}</div>
        </div>
    );
};

export default PromotionExpired;
