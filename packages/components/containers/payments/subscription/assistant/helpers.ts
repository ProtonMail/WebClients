import { c } from 'ttag';

import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

export const getScribeWritingAssistantText = (scribeToLumo: boolean) => {
    return scribeToLumo
        ? c('Info').t`${LUMO_SHORT_APP_NAME} writing assistant`
        : c('Info').t`${BRAND_NAME} Scribe writing assistant`;
};

export const getScribeUpsellText = (scribeToLumo: boolean) => {
    return scribeToLumo
        ? c('Assistant toggle')
              .t`Take email productivity to new levels. Let ${LUMO_SHORT_APP_NAME} help you write, reply to, and proofread your emails.`
        : c('Assistant toggle')
              .t`Take email productivity to new levels. Let ${BRAND_NAME} Scribe help you write, reply to, and proofread your emails.`;
};

export const getScribeUpsellLearnMore = () => {
    return getKnowledgeBaseUrl('/proton-scribe-writing-assistant');
};
