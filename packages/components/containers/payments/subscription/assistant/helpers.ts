import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { User } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

export function isScribePaymentsEnabled(user?: User): boolean {
    // users on the legacy subscriptions and who didn't get the feature flag for on-session migration, can't buy the assistant
    return user?.ChargebeeUser !== ChargebeeEnabled.INHOUSE_FORCED;
}

export const getScribeUpsellText = () => {
    return c('Assistant toggle')
        .t`Take email productivity to new levels. Let ${BRAND_NAME} Scribe help you write, reply to, and proofread your emails.`;
};

export const getScribeUpsellLearnMore = () => {
    return getKnowledgeBaseUrl('/proton-scribe-writing-assistant');
};
