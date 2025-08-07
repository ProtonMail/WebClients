import { c } from 'ttag';

import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import {
    type RetentionRule,
    RetentionRuleAction,
    RetentionRuleProduct,
} from '@proton/shared/lib/interfaces/RetentionRule';

import type { RetentionRuleFormData } from './types';

const CLIENT_ID_PREFIX = 'RetentionPolicyClientID:';

export const getActionLabel = (action: RetentionRuleAction) => {
    if (action === RetentionRuleAction.RetainPurgeAll) {
        return c('retention_policy_2025_Action').t`Purge all`;
    }
    if (action === RetentionRuleAction.RetainPurgeDeleted) {
        return c('retention_policy_2025_Action').t`Purge deleted`;
    }

    return action.toString();
};

export const getProductLabel = (product: RetentionRuleProduct) => {
    if (product === RetentionRuleProduct.Mail) {
        return MAIL_APP_NAME;
    }

    return `Unknown`;
};

export const getLogoProductLabel = (product: RetentionRuleProduct) => {
    if (product === RetentionRuleProduct.Mail) {
        return APPS.PROTONMAIL;
    }
    return APPS.PROTONMAIL;
};

export const convertToRetentionRuleFormData = (retentionRule: RetentionRule): RetentionRuleFormData => {
    return {
        id: retentionRule.ID,
        name: retentionRule.Name,
        products: retentionRule.Products,
        lifetime: retentionRule.Lifetime ? Math.round(retentionRule.Lifetime / (24 * 60 * 60)) : null, // Convert seconds to days
        action: retentionRule.Action,
        scopes: retentionRule.Scopes.map((scope) => ({
            id: scope.ID,
            entityType: scope.EntityType,
            entityID: scope.EntityID,
        })),
    };
};

export const generateClientIDForRuleScope = () => {
    return CLIENT_ID_PREFIX + crypto.randomUUID();
};

export const isClientIDRuleScope = (id: string) => {
    return id.startsWith(CLIENT_ID_PREFIX);
};
