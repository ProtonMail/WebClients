import type {
    RetentionRuleAction,
    RetentionRuleProduct,
    RetentionRuleScopeType,
} from '@proton/shared/lib/interfaces/RetentionRule';

export type ProductScopeFilterOptions = Record<RetentionRuleProduct, RetentionRuleScopeType[]>;

export interface RetentionRuleScopeFormData {
    id: string;
    entityType: RetentionRuleScopeType;
    entityID: string;
}

export interface RetentionRuleFormData {
    id: string | null;
    name: string;
    products: RetentionRuleProduct;
    lifetime: number | null; // in days
    action: RetentionRuleAction;
    scopes: RetentionRuleScopeFormData[];
}
