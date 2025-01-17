import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

export const getScribeUpsellText = () => {
    return c('Assistant toggle')
        .t`Take email productivity to new levels. Let ${BRAND_NAME} Scribe help you write, reply to, and proofread your emails.`;
};

export const getScribeUpsellLearnMore = () => {
    return getKnowledgeBaseUrl('/proton-scribe-writing-assistant');
};
