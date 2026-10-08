import type { ADDON_NAMES, PLANS } from '../constants';
import type { PlanIDs } from '../interface';
import { getPlanIDs } from '../subscription/helpers/plan-ids';
import type { MaybeFreeSubscription } from '../subscription/interface';
import { emptyEntitlementCatalog } from './empty-entitlement-catalog';
import type { EntitlementName } from './entitlement-names';
import {
    type EntitlementCatalog,
    type EntitlementCatalogEntry,
    EntitlementMergeStrategy,
    type ResolvedEntitlement,
} from './interface';

interface CatalogNode {
    entitlements: EntitlementCatalogEntry[];
    catalogOrder: number;
}

type CatalogNodesByPlanName = Map<PLANS | ADDON_NAMES, CatalogNode[]>;

const catalogNodesByPlanNameCache = new WeakMap<EntitlementCatalog, CatalogNodesByPlanName>();

function getCatalogNodesByPlanName(catalog: EntitlementCatalog): CatalogNodesByPlanName {
    const cached = catalogNodesByPlanNameCache.get(catalog);
    if (cached) {
        return cached;
    }

    const nodesByPlanName: CatalogNodesByPlanName = new Map();
    let catalogOrder = 0;
    for (const plansOrAddons of [catalog.Plans, catalog.Addons]) {
        for (const plan of plansOrAddons) {
            const node: CatalogNode = { entitlements: plan.Entitlements, catalogOrder };
            catalogOrder++;

            const nodes = nodesByPlanName.get(plan.Name);
            if (nodes) {
                nodes.push(node);
            } else {
                nodesByPlanName.set(plan.Name, [node]);
            }
        }
    }

    catalogNodesByPlanNameCache.set(catalog, nodesByPlanName);
    return nodesByPlanName;
}

interface SelectedNode {
    entitlements: EntitlementCatalogEntry[];
    catalogOrder: number;
    count: number;
}

function getSelectedNodesInCatalogOrder(catalog: EntitlementCatalog, planIDs: PlanIDs): SelectedNode[] {
    const nodesByPlanName = getCatalogNodesByPlanName(catalog);

    const selectedNodes: SelectedNode[] = [];
    for (const planName of Object.keys(planIDs) as (PLANS | ADDON_NAMES)[]) {
        const count = planIDs[planName] ?? 0;
        if (!(count > 0)) {
            continue;
        }

        const nodes = nodesByPlanName.get(planName);
        if (!nodes) {
            continue;
        }

        for (const { entitlements, catalogOrder } of nodes) {
            selectedNodes.push({ entitlements, catalogOrder, count });
        }
    }

    return selectedNodes.sort((a, b) => a.catalogOrder - b.catalogOrder);
}

export function getEntitlementsPerPlan(
    entitlementCatalog: EntitlementCatalog | undefined,
    planIDs: PlanIDs
): ResolvedEntitlement[] {
    const mergedEntitlements: ResolvedEntitlement[] = [];
    const mergedByName = new Map<
        EntitlementName,
        { resolved: ResolvedEntitlement; strategy: EntitlementMergeStrategy }
    >();

    for (const { entitlements, count } of getSelectedNodesInCatalogOrder(
        entitlementCatalog ?? emptyEntitlementCatalog,
        planIDs
    )) {
        for (const entry of entitlements) {
            const merged = mergedByName.get(entry.Name);

            if (!merged) {
                // the first entry for a name decides both the scope and how the rest are merged in;
                // anything other than Sum falls back to Max
                const resolved: ResolvedEntitlement = {
                    name: entry.Name,
                    quantity:
                        entry.MergeStrategy === EntitlementMergeStrategy.Sum ? entry.Quantity * count : entry.Quantity,
                    scope: entry.Scope,
                };
                mergedEntitlements.push(resolved);
                mergedByName.set(entry.Name, { resolved, strategy: entry.MergeStrategy });
                continue;
            }

            if (merged.strategy === EntitlementMergeStrategy.Sum) {
                // an addon bought twice contributes twice
                merged.resolved.quantity += entry.Quantity * count;
            } else {
                merged.resolved.quantity = Math.max(merged.resolved.quantity, entry.Quantity);
            }
        }
    }

    return mergedEntitlements;
}

export function getEntitlementsPerSubscription(
    entitlementCatalog: EntitlementCatalog | undefined,
    subscription: MaybeFreeSubscription
): ResolvedEntitlement[] {
    return getEntitlementsPerPlan(entitlementCatalog, getPlanIDs(subscription));
}
