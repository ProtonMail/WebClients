import { c } from 'ttag';

import { IcShield } from '@proton/icons/icons/IcShield';

const Guarantee = () => {
    return (
        <span className="color-success">
            <IcShield className="align-text-bottom mr-1" />
            <span>{c('Info').t`30-day money-back guarantee`}</span>
        </span>
    );
};

export default Guarantee;
