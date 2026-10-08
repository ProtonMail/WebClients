import type { ADDON_NAMES, PLANS } from '../core/constants';
import type { EntitlementName } from '../core/entitlements/entitlement-names';
import {
    type EntitlementCatalog,
    type EntitlementCatalogEntry,
    type EntitlementCatalogPlan,
    EntitlementMergeStrategy,
    EntitlementScope,
    EntitlementType,
} from '../core/entitlements/interface';

type Grant = EntitlementName | EntitlementCatalogEntry;

export const catalogEntry = (
    Name: EntitlementName,
    overrides: Partial<EntitlementCatalogEntry> = {}
): EntitlementCatalogEntry => ({
    Name,
    Type: EntitlementType.Switch,
    Quantity: 1,
    Scope: EntitlementScope.Organization,
    MergeStrategy: EntitlementMergeStrategy.Max,
    ...overrides,
});

const toCatalogPlans = (grants: Partial<Record<PLANS | ADDON_NAMES, Grant[]>>): EntitlementCatalogPlan[] =>
    Object.entries(grants).map(([Name, entries = []]) => ({
        Name: Name as PLANS | ADDON_NAMES,
        Entitlements: entries.map((entry) => (typeof entry === 'string' ? catalogEntry(entry) : entry)),
    }));

export const buildEntitlementCatalog = (
    plans: Partial<Record<PLANS, Grant[]>> = {},
    addons: Partial<Record<ADDON_NAMES, Grant[]>> = {}
): EntitlementCatalog => ({
    Plans: toCatalogPlans(plans),
    Addons: toCatalogPlans(addons),
});
