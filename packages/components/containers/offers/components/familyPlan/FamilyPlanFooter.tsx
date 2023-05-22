import { c } from 'ttag';

import { OfferProps } from '../../interface';
import OfferDisableButton from '../shared/OfferDisableButton';

const FamilyPlanFooter = (props: OfferProps) => {
    return (
        <div className="mb-4">
            <div className="text-center">
                <OfferDisableButton {...props} />
            </div>
            <p className="text-sm text-center color-weak">
                {c('familyOffer_2023:Footer').t`Discounts are based on the standard monthly pricing.`}
                <br />
                {c('familyOffer_2023:Footer')
                    .t`*Your subscription will automatically renew at the same rate at the end of your billing cycle.`}
            </p>
        </div>
    );
};

export default FamilyPlanFooter;
