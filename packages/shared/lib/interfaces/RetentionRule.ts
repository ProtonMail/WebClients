export enum RetentionRuleProduct {
    Mail = 1,
}

export enum RetentionRuleAction {
    RetainPurgeDeleted = 0,
    RetainPurgeAll = 1,
    RetainAll = 2,
}

export enum RetentionRuleScopeType {
    User = 1,
    Group = 2,
}

export interface RetentionRuleScope {
    ID: string;
    EntityType: RetentionRuleScopeType;
    EntityID: string;
}

export interface RetentionRule {
    ID: string;
    OrganizationID: string;
    Products: RetentionRuleProduct;
    Lifetime: number | null; // in seconds
    Action: RetentionRuleAction;
    Name: string;
    Scopes: RetentionRuleScope[];
    CreateTime: number;
    ModifyTime: number;
}
