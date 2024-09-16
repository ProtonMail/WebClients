import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

import { useDealContext } from './DealContext';

const DealGuarantee = () => {
    const { deal } = useDealContext();
    if (deal?.isGuaranteed === true) {
        return (
            <p className="flex mx-auto text-sm m-0 max-w-full flex-nowrap color-success">
                <span className="shrink-0 flex mr-1">
                    <Icon name="shield" />
                </span>
                <span className="flex-1">{c('bf2023: Offers').t`30-day money-back guarantee`}</span>
            </p>
        );
    }
    return null;
};

export default DealGuarantee;
