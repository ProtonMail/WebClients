import { c } from 'ttag';

import { Icon } from '@proton/components/components';

import { useDealContext } from './DealContext';

const DealGuarantee = () => {
    const { deal } = useDealContext();
    if (deal?.isGuaranteed === true) {
        return (
            <p className="flex mx-auto flex-items-align-center text-sm m-0 max-w-full flex-nowrap color-success">
                <span className="flex-item-noshrink flex mr-1">
                    <Icon name="shield" />
                </span>
                <span className="flex-item-fluid">{c('bf2023: Offers').t`30-day money-back guarantee`}</span>
            </p>
        );
    }
    return null;
};

export default DealGuarantee;
