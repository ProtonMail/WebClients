import { RetentionRuleProduct, RetentionRuleScopeType } from '@proton/shared/lib/interfaces/RetentionRule';

import type { ProductScopeFilterOptions } from './types';

export const SUPPORTED_PRODUCTS = [RetentionRuleProduct.Mail];

export const PRODUCT_FILTER_OPTIONS: ProductScopeFilterOptions = {
    [SUPPORTED_PRODUCTS[0]]: [RetentionRuleScopeType.User, RetentionRuleScopeType.Group],
};
