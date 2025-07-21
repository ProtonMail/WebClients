import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import { RetentionRuleAction, RetentionRuleProduct } from '@proton/shared/lib/interfaces/RetentionRule';

const CLIENT_ID_PREFIX = 'RetentionPolicyClientID:';

export const getActionLabel = (action: RetentionRuleAction) => {
    if (action === RetentionRuleAction.RetainPurgeAll) {
        return c('Action').t`Purge all`;
    }
    if (action === RetentionRuleAction.RetainPurgeDeleted) {
        return c('Action').t`Purge deleted`;
    }

    return action.toString();
};

export const getLogoProductLabel = (product: RetentionRuleProduct) => {
    if (product === RetentionRuleProduct.Mail) {
        return APPS.PROTONMAIL;
    }
    return APPS.PROTONMAIL;
};

export const generateClientIDForRuleScope = () => {
    return CLIENT_ID_PREFIX + crypto.randomUUID();
};

export const isClientIDRuleScope = (id: string) => {
    return id.startsWith(CLIENT_ID_PREFIX);
};
