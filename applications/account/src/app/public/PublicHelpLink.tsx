import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const PublicHelpLink = () => {
    return (
        <Href className="signup-link link-focus" href={getKnowledgeBaseUrl('/common-login-problems')}>
            {c('Link').t`Help`}
        </Href>
    );
};

export default PublicHelpLink;
