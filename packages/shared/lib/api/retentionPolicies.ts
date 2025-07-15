import type { RetentionRuleAction, RetentionRuleProduct, RetentionRuleScopeType } from '../interfaces/RetentionRule';

export interface RetentionRuleScopePayload {
    ID: string | null;
    EntityType: RetentionRuleScopeType;
    EntityID: string;
}

export interface RetentionRulePayload {
    Name: string;
    Products: RetentionRuleProduct;
    Lifetime: number | null;
    Action: RetentionRuleAction;
    Scopes: RetentionRuleScopePayload[];
}

export const createRetentionRuleApi = (data: RetentionRulePayload) => ({
    method: 'post',
    url: 'account/retention/v1/rule',
    data,
});

export const updateRetentionRuleApi = (id: string, data: RetentionRulePayload) => ({
    method: 'put',
    url: `account/retention/v1/rule/${id}`,
    data: {
        ...data,
    },
});

export const deleteRetentionRuleApi = (id: string) => ({
    method: 'delete',
    url: `account/retention/v1/rule/${id}`,
});

export const getRetentionRules = () => ({
    method: 'get',
    url: 'account/retention/v1/rule',
});
