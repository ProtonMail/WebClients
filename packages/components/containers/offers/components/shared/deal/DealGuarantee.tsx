import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IcShield } from '@proton/icons/icons/IcShield';
import { getSupportContactURL } from '@proton/shared/lib/helpers/url';

import { useDealContext } from './DealContext';

const DealGuarantee = () => {
    const { deal } = useDealContext();
    if (deal?.isGuaranteed === true) {
        const customerSupportLink = (
            <Href key="customer-support" href={getSupportContactURL({})}>{c('Link').t`Customer Support`}</Href>
        );

        return (
            <p className="flex mx-auto text-sm m-0 max-w-full flex-nowrap color-success">
                <span className="shrink-0 flex mr-1">
                    <IcShield />
                </span>
                <span className="flex-1">{c('bf2023: Offers')
                    .jt`30-day money-back guarantee: cancel within 30 days of your purchase and contact our ${customerSupportLink} to obtain a refund.`}</span>
            </p>
        );
    }
    return null;
};

export default DealGuarantee;
