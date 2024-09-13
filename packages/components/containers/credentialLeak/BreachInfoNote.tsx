import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const BreachInfoNote = () => {
    const learnMoreLink = (
        <Href key="link" href={getKnowledgeBaseUrl('/dark-web-monitoring')} className="inline-block">
            {
                // translator: full sentence is: The exposed information was leaked from a third-party service. Your Proton account information remains secure and encrypted. <Learn more>
                c('Link').jt`Learn more`
            }
        </Href>
    );

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
