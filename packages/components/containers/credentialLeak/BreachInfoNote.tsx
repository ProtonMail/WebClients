import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';

// translator: full sentence is: The exposed information was leaked from a third-party service. Your Proton account information remains secure and encrypted. <Learn more>
const learnMoreLink = (
    <Href key="link" href="TODO" className="color-weak inline-block">{c('Link').jt`Learn more`}</Href>
);

const BreachInfoNote = () => {
    return (
        <p className="color-weak text-sm">
            {
                // translator: full sentence is: The exposed information was leaked from a third-party service. Your Proton account information remains secure and encrypted. <Learn more>
                c('Info')
                    .jt`The exposed information was leaked from a third-party service. Your ${BRAND_NAME} Account information remains secure and encrypted. ${learnMoreLink}`
            }
        </p>
    );
};

export default BreachInfoNote;
