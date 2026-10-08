import { buildSubscription } from '../../testing/buildSubscription';
import { ADDON_NAMES, PLANS } from '../constants';
import { getEntitlementsPerPlan, getEntitlementsPerSubscription } from './entitlement-grants';
import { EntitlementName } from './entitlement-names';
import {
    type EntitlementCatalog,
    type EntitlementCatalogEntry,
    type EntitlementCatalogPlan,
    EntitlementMergeStrategy,
    EntitlementScope,
    EntitlementType,
} from './interface';

const valueEntry = (
    name: EntitlementName,
    quantity: number,
    mergeStrategy: EntitlementMergeStrategy = EntitlementMergeStrategy.Sum
): EntitlementCatalogEntry => ({
    Name: name,
    Type: EntitlementType.Value,
    Quantity: quantity,
    Scope: EntitlementScope.Organization,
    MergeStrategy: mergeStrategy,
});

const switchEntry = (name: EntitlementName): EntitlementCatalogEntry => ({
    Name: name,
    Type: EntitlementType.Switch,
    Quantity: 1,
    Scope: EntitlementScope.Organization,
    MergeStrategy: EntitlementMergeStrategy.Max,
});

const makeCatalog = (plans: EntitlementCatalogPlan[], addons: EntitlementCatalogPlan[] = []): EntitlementCatalog => ({
    Plans: plans,
    Addons: addons,
});

describe('getEntitlementsPerPlan', () => {
    it('returns empty array when no plan matches', () => {
        const catalog = makeCatalog([{ Name: PLANS.DRIVE, Entitlements: [switchEntry(EntitlementName.Business)] }]);
        expect(getEntitlementsPerPlan(catalog, { [PLANS.PASS]: 1 })).toEqual([]);
    });

    it('grants nothing for a plan or addon with quantity 0', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.Business)] }],
            [{ Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO, Entitlements: [valueEntry(EntitlementName.MaxDomains, 3)] }]
        );

        const result = getEntitlementsPerPlan(catalog, {
            [PLANS.BUNDLE_PRO]: 0,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 0,
        });

        expect(result).toEqual([]);
    });

    it('includes entitlements granted by an addon in the subscription', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.Business)] }],
            [{ Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.MaxDomains)] }]
        );

        const result = getEntitlementsPerPlan(catalog, {
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
        });

        expect(result).toEqual([
            { name: EntitlementName.Business, quantity: 1, scope: EntitlementScope.Organization },
            { name: EntitlementName.MaxDomains, quantity: 1, scope: EntitlementScope.Organization },
        ]);
    });

    it('includes addon-only grants with no plan match', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.Business)] }],
            [{ Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.MaxDomains)] }]
        );

        const result = getEntitlementsPerPlan(catalog, { [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1 });

        expect(result).toEqual([
            { name: EntitlementName.MaxDomains, quantity: 1, scope: EntitlementScope.Organization },
        ]);
    });

    it('multiplies Sum merge quantity by the number of times the addon is bought', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.DRIVE_PRO, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100)] }],
            [{ Name: ADDON_NAMES.MEMBER_DRIVE_PRO, Entitlements: [valueEntry(EntitlementName.MaxSpace, 50)] }]
        );

        const result = getEntitlementsPerPlan(catalog, {
            [PLANS.DRIVE_PRO]: 1,
            [ADDON_NAMES.MEMBER_DRIVE_PRO]: 2,
        });

        expect(result).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 200, scope: EntitlementScope.Organization },
        ]);
    });

    it('takes the plan-level Sum quantity as-is because a plan can only be selected once', () => {
        const catalog = makeCatalog([{ Name: PLANS.DRIVE, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100)] }]);

        const result = getEntitlementsPerPlan(catalog, { [PLANS.DRIVE]: 1 });

        expect(result).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 100, scope: EntitlementScope.Organization },
        ]);
    });

    it('does not multiply Max merge quantities by the count', () => {
        const catalog = makeCatalog(
            [
                {
                    Name: PLANS.DRIVE_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxDedicatedIps, 1, EntitlementMergeStrategy.Max)],
                },
            ],
            [
                {
                    Name: ADDON_NAMES.MEMBER_DRIVE_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxDedicatedIps, 2, EntitlementMergeStrategy.Max)],
                },
            ]
        );

        const result = getEntitlementsPerPlan(catalog, {
            [PLANS.DRIVE_PRO]: 1,
            [ADDON_NAMES.MEMBER_DRIVE_PRO]: 2,
        });

        expect(result).toEqual([
            { name: EntitlementName.MaxDedicatedIps, quantity: 2, scope: EntitlementScope.Organization },
        ]);
    });

    it('preserves catalog order regardless of the order of the planIDs keys', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.Business)] }],
            [{ Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.MaxDomains)] }]
        );

        const result = getEntitlementsPerPlan(catalog, {
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
            [PLANS.BUNDLE_PRO]: 1,
        });

        expect(result.map((e) => e.name)).toEqual([EntitlementName.Business, EntitlementName.MaxDomains]);
    });

    it('returns an empty array for empty planIDs', () => {
        const catalog = makeCatalog([{ Name: PLANS.DRIVE, Entitlements: [switchEntry(EntitlementName.Business)] }]);

        expect(getEntitlementsPerPlan(catalog, {})).toEqual([]);
    });

    it('returns the same result when the same catalog object is used twice', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.DRIVE_PRO, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100)] }],
            [{ Name: ADDON_NAMES.MEMBER_DRIVE_PRO, Entitlements: [valueEntry(EntitlementName.MaxSpace, 50)] }]
        );

        const first = getEntitlementsPerPlan(catalog, { [PLANS.DRIVE_PRO]: 1, [ADDON_NAMES.MEMBER_DRIVE_PRO]: 2 });
        const second = getEntitlementsPerPlan(catalog, { [PLANS.DRIVE_PRO]: 1, [ADDON_NAMES.MEMBER_DRIVE_PRO]: 2 });

        expect(first).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 200, scope: EntitlementScope.Organization },
        ]);
        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('reflects a different catalog object rather than reusing the previous index', () => {
        const before = makeCatalog([{ Name: PLANS.DRIVE, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100)] }]);
        const after = makeCatalog([
            {
                Name: PLANS.DRIVE,
                Entitlements: [valueEntry(EntitlementName.MaxSpace, 100), switchEntry(EntitlementName.Business)],
            },
        ]);

        expect(getEntitlementsPerPlan(before, { [PLANS.DRIVE]: 1 }).map((e) => e.name)).toEqual([
            EntitlementName.MaxSpace,
        ]);
        expect(getEntitlementsPerPlan(after, { [PLANS.DRIVE]: 1 }).map((e) => e.name)).toEqual([
            EntitlementName.MaxSpace,
            EntitlementName.Business,
        ]);
    });

    it('merges every catalog node sharing a plan name', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.DRIVE, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100)] }],
            [{ Name: PLANS.DRIVE, Entitlements: [valueEntry(EntitlementName.MaxSpace, 25)] }]
        );

        expect(getEntitlementsPerPlan(catalog, { [PLANS.DRIVE]: 1 })).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 125, scope: EntitlementScope.Organization },
        ]);
    });
});

describe('getEntitlementsPerPlan merge strategies', () => {
    const unknownStrategy = 7 as EntitlementMergeStrategy;

    it('does not multiply an unknown merge strategy by the addon count', () => {
        const catalog = makeCatalog(
            [],
            [
                {
                    Name: ADDON_NAMES.MEMBER_DRIVE_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxSpace, 100, unknownStrategy)],
                },
            ]
        );

        expect(getEntitlementsPerPlan(catalog, { [ADDON_NAMES.MEMBER_DRIVE_PRO]: 3 })).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 100, scope: EntitlementScope.Organization },
        ]);
    });

    it('falls back to Max when the first entry declares an unknown merge strategy', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.DRIVE_PRO, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100, unknownStrategy)] }],
            [
                {
                    Name: ADDON_NAMES.MEMBER_DRIVE_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxSpace, 250, unknownStrategy)],
                },
            ]
        );

        expect(getEntitlementsPerPlan(catalog, { [PLANS.DRIVE_PRO]: 1, [ADDON_NAMES.MEMBER_DRIVE_PRO]: 2 })).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 250, scope: EntitlementScope.Organization },
        ]);
    });

    it('maxes the addon contribution when the plan entry declares Max and the addon declares Sum', () => {
        const catalog = makeCatalog(
            [
                {
                    Name: PLANS.MAIL_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxSpace, 500, EntitlementMergeStrategy.Max)],
                },
            ],
            [
                {
                    Name: ADDON_NAMES.MEMBER_MAIL_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxSpace, 100, EntitlementMergeStrategy.Sum)],
                },
            ]
        );

        expect(getEntitlementsPerPlan(catalog, { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 3 })).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 500, scope: EntitlementScope.Organization },
        ]);
    });

    it('sums the addon contribution when the plan entry declares Sum and the addon declares Max', () => {
        const catalog = makeCatalog(
            [
                {
                    Name: PLANS.MAIL_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxSpace, 500, EntitlementMergeStrategy.Sum)],
                },
            ],
            [
                {
                    Name: ADDON_NAMES.MEMBER_MAIL_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxSpace, 100, EntitlementMergeStrategy.Max)],
                },
            ]
        );

        expect(getEntitlementsPerPlan(catalog, { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 3 })).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 800, scope: EntitlementScope.Organization },
        ]);
    });

    it('takes the scope from the first entry in catalog order', () => {
        const catalog = makeCatalog(
            [
                {
                    Name: PLANS.MAIL_PRO,
                    Entitlements: [
                        {
                            ...valueEntry(EntitlementName.MaxSpace, 500, EntitlementMergeStrategy.Sum),
                            Scope: EntitlementScope.MemberAssignable,
                        },
                    ],
                },
            ],
            [
                {
                    Name: ADDON_NAMES.MEMBER_MAIL_PRO,
                    Entitlements: [valueEntry(EntitlementName.MaxSpace, 100, EntitlementMergeStrategy.Sum)],
                },
            ]
        );

        expect(getEntitlementsPerPlan(catalog, { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 1 })).toEqual([
            { name: EntitlementName.MaxSpace, quantity: 600, scope: EntitlementScope.MemberAssignable },
        ]);
    });

    it('grants nothing for a plan present in planIDs with an undefined count', () => {
        const catalog = makeCatalog([{ Name: PLANS.DRIVE, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100)] }]);

        expect(getEntitlementsPerPlan(catalog, { [PLANS.DRIVE]: undefined as unknown as number })).toEqual([]);
    });
});

describe('getEntitlementsPerSubscription', () => {
    it('folds entitlements from both plans and addons of the subscription', () => {
        const catalog = makeCatalog(
            [{ Name: PLANS.BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.Business)] }],
            [{ Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO, Entitlements: [switchEntry(EntitlementName.MaxDomains)] }]
        );

        const subscription = buildSubscription({ [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1 });

        expect(getEntitlementsPerSubscription(catalog, subscription).map((e) => e.name)).toEqual([
            EntitlementName.Business,
            EntitlementName.MaxDomains,
        ]);
    });
});
