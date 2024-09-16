import { c } from 'ttag';

import { Icon } from '@proton/components';

const Guarantee = () => {
    return (
        <span className="color-success">
            <Icon name="shield" className="align-text-bottom mr-1" />
            <span>{c('Info').t`30-day money-back guarantee`}</span>
        </span>
    );
};

export default Guarantee;
