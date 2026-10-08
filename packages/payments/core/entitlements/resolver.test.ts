import { buildSubscription } from '../../testing/buildSubscription';
import { makeEntitlements } from '../../testing/makeEntitlements';
import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS } from '../constants';
import { EntitlementName } from './entitlement-names';
import {
    type Entitlement,
    type EntitlementCatalog,
    EntitlementMergeStrategy,
    EntitlementScope,
    EntitlementType,
} from './interface';
import { createEntitlementResolverForOrgAndUser, createEntitlementResolverForSelection } from './resolver';

const emptyCatalog: EntitlementCatalog = {
    Plans: [],
    Addons: [],
};

const switchEntry = (name: EntitlementName) => ({
    Name: name,
    Type: EntitlementType.Switch,
    Quantity: 1,
    Scope: EntitlementScope.Organization,
    MergeStrategy: EntitlementMergeStrategy.Max,
});

const catalogWith = (plan: PLANS, names: EntitlementName[]): EntitlementCatalog => ({
    Plans: [{ Name: plan, Entitlements: names.map(switchEntry) }],
    Addons: [],
});

const zeroQuantityEntry = (name: EntitlementName) => ({ ...switchEntry(name), Quantity: 0 });

describe('createEntitlementResolver', () => {
    it('exposes the full method surface', () => {
        const resolver = createEntitlementResolverForOrgAndUser(emptyCatalog, undefined, []);
        expect(typeof resolver.resolveForMember).toBe('function');
        expect(typeof resolver.resolveTotal).toBe('function');
        expect(typeof resolver.quantityForMember).toBe('function');
        expect(typeof resolver.quantityTotal).toBe('function');
        expect(typeof resolver.findSubscriptionsMatching).toBe('function');
        expect(typeof resolver.hasMatchingSubscription).toBe('function');
    });

    it('handles undefined entitlements without throwing', () => {
        const resolver = createEntitlementResolverForOrgAndUser(emptyCatalog, undefined, []);
        expect(resolver.quantityForMember(EntitlementName.MaxSpace)).toBe(0);
        expect(resolver.quantityTotal(EntitlementName.MaxSpace)).toBe(0);
        expect(resolver.resolveForMember(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
        expect(resolver.resolveTotal(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
        expect(resolver.isBusiness).toBe(false);
    });

    it('delegates each method to the captured entitlements', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.Business,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Organization,
                },
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 500,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.MemberAssignable,
                },
            ],
            [],
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 100,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.MemberAssignable,
                },
            ]
        );
        const resolver = createEntitlementResolverForOrgAndUser(emptyCatalog, entitlements, []);

        expect(resolver.resolveForMember(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.MemberAssignable,
        });
        expect(resolver.resolveTotal(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.MemberAssignable,
        });
        expect(resolver.quantityForMember(EntitlementName.MaxSpace)).toBe(100);
        expect(resolver.quantityTotal(EntitlementName.MaxSpace)).toBe(500);
    });

    it('binds named checks built on top of the resolver under .checks', () => {
        const business = createEntitlementResolverForOrgAndUser(
            emptyCatalog,
            makeEntitlements(
                [
                    {
                        Name: EntitlementName.Business,
                        Quantity: 1,
                        Type: EntitlementType.Switch,
                        Scope: EntitlementScope.Organization,
                    },
                ],
                [],
                []
            ),
            [buildSubscription(PLANS.DUO)]
        );
        const consumer = createEntitlementResolverForOrgAndUser(emptyCatalog, makeEntitlements([], [], []), []);

        expect(business.isBusiness).toBe(true);
        expect(consumer.isBusiness).toBe(false);
    });

    describe('isB2cMultiUser', () => {
        it('should be true for a multi-user personal plan', () => {
            const resolver = createEntitlementResolverForOrgAndUser(
                catalogWith(PLANS.DUO, [EntitlementName.MultiUser]),
                makeEntitlements([], [], []),
                [buildSubscription(PLANS.DUO)]
            );

            expect(resolver.isB2cMultiUser).toBe(true);
        });

        it('should be false for a multi-user business plan', () => {
            const resolver = createEntitlementResolverForOrgAndUser(
                catalogWith(PLANS.DUO, [EntitlementName.MultiUser, EntitlementName.Business]),
                makeEntitlements([], [], []),
                [buildSubscription(PLANS.DUO)]
            );

            expect(resolver.isB2cMultiUser).toBe(false);
        });

        it('should be false for a single-user plan', () => {
            const resolver = createEntitlementResolverForOrgAndUser(
                catalogWith(PLANS.DRIVE, []),
                makeEntitlements([], [], []),
                [buildSubscription(PLANS.DRIVE)]
            );

            expect(resolver.isB2cMultiUser).toBe(false);
        });

        it('should be false when there are no subscriptions at all', () => {
            const resolver = createEntitlementResolverForOrgAndUser(emptyCatalog, undefined, []);

            expect(resolver.isB2cMultiUser).toBe(false);
        });
    });

    describe('a zero quantity means the entitlement is not granted', () => {
        it('reads a zero org entitlement as absent', () => {
            const resolver = createEntitlementResolverForOrgAndUser(
                emptyCatalog,
                makeEntitlements([
                    {
                        Name: EntitlementName.Business,
                        Type: EntitlementType.Switch,
                        Quantity: 0,
                        Scope: EntitlementScope.Organization,
                    },
                ]),
                []
            );

            expect(resolver.quantityTotal(EntitlementName.Business)).toBe(0);
            expect(resolver.hasEntitlement(EntitlementName.Business)).toBe(false);
            expect(resolver.isBusiness).toBe(false);
        });

        it('does not let a zero-quantity catalog entry satisfy includes or trip excludes', () => {
            const catalog: EntitlementCatalog = {
                Plans: [
                    {
                        Name: PLANS.DUO,
                        Entitlements: [
                            switchEntry(EntitlementName.MultiUser),
                            zeroQuantityEntry(EntitlementName.Business),
                        ],
                    },
                ],
                Addons: [],
            };
            const resolver = createEntitlementResolverForOrgAndUser(catalog, makeEntitlements([], [], []), [
                buildSubscription(PLANS.DUO),
            ]);

            // eslint-disable-next-line custom-rules/no-single-entitlement-condition -- testing `hasMatchingSubscription` itself
            expect(resolver.hasMatchingSubscription({ includes: [EntitlementName.Business] })).toBe(false);
            // Business is listed on the plan but granted as 0, so it must not exclude the plan either
            expect(resolver.isB2cMultiUser).toBe(true);
        });
    });
});

describe('createEntitlementResolverForSelection', () => {
    const valueEntry = (name: EntitlementName, quantity: number) => ({
        Name: name,
        Type: EntitlementType.Value,
        Quantity: quantity,
        Scope: EntitlementScope.Organization,
        MergeStrategy: EntitlementMergeStrategy.Sum,
    });

    const catalog: EntitlementCatalog = {
        Plans: [
            {
                Name: PLANS.MAIL_PRO,
                Entitlements: [valueEntry(EntitlementName.MaxSpace, 500), zeroQuantityEntry(EntitlementName.Business)],
            },
        ],
        Addons: [{ Name: ADDON_NAMES.MEMBER_MAIL_PRO, Entitlements: [valueEntry(EntitlementName.MaxSpace, 100)] }],
    };

    it('reports the merged amount the selected plans grant', () => {
        const resolver = createEntitlementResolverForSelection(catalog, {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        });

        expect(resolver.quantityTotal(EntitlementName.MaxSpace)).toBe(800);
        expect(resolver.resolveTotal(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 800,
            scope: EntitlementScope.Organization,
        });
    });

    it('returns 0 for an entitlement the selection does not grant', () => {
        const resolver = createEntitlementResolverForSelection(catalog, PLANS.MAIL_PRO);

        expect(resolver.quantityTotal(EntitlementName.Sentinel)).toBe(0);
        expect(resolver.resolveTotal(EntitlementName.Sentinel)).toEqual({
            name: EntitlementName.Sentinel,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
    });

    it('reads a zero-quantity catalog entry as not granted, like the org/user resolver does', () => {
        const resolver = createEntitlementResolverForSelection(catalog, PLANS.MAIL_PRO);

        expect(resolver.quantityTotal(EntitlementName.Business)).toBe(0);
        expect(resolver.hasEntitlement(EntitlementName.Business)).toBe(false);
        // eslint-disable-next-line custom-rules/no-single-entitlement-condition -- testing `hasMatchingSubscription` itself
        expect(resolver.hasMatchingSubscription({ includes: [EntitlementName.Business] })).toBe(false);
        expect(resolver.isBusiness).toBe(false);
    });

    it('returns 0 for an empty selection', () => {
        const resolver = createEntitlementResolverForSelection(catalog, null);

        expect(resolver.quantityTotal(EntitlementName.MaxSpace)).toBe(0);
    });

    it('answers the shared named checks against the selection, not the current org', () => {
        const b2bCatalog: EntitlementCatalog = {
            Plans: [
                {
                    Name: PLANS.MAIL_PRO,
                    Entitlements: [
                        switchEntry(EntitlementName.Business),
                        switchEntry(EntitlementName.Sentinel),
                        switchEntry(EntitlementName.MultiUser),
                    ],
                },
            ],
            Addons: [],
        };

        const business = createEntitlementResolverForSelection(b2bCatalog, PLANS.MAIL_PRO);
        expect(business.isBusiness).toBe(true);
        expect(business.hasSentinel).toBe(true);
        expect(business.isMultiUser).toBe(true);
        expect(business.hasVpn).toBe(false);

        const free = createEntitlementResolverForSelection(b2bCatalog, null);
        expect(free.isBusiness).toBe(false);
        expect(free.hasSentinel).toBe(false);
    });
});

describe('createEntitlementResolverForSelection selection shapes', () => {
    const catalog: EntitlementCatalog = {
        Plans: [
            {
                Name: PLANS.MAIL_PRO,
                Entitlements: [
                    {
                        Name: EntitlementName.MaxSpace,
                        Type: EntitlementType.Value,
                        Quantity: 500,
                        Scope: EntitlementScope.Organization,
                        MergeStrategy: EntitlementMergeStrategy.Sum,
                    },
                ],
            },
        ],
        Addons: [
            {
                Name: ADDON_NAMES.MEMBER_MAIL_PRO,
                Entitlements: [
                    {
                        Name: EntitlementName.MaxSpace,
                        Type: EntitlementType.Value,
                        Quantity: 100,
                        Scope: EntitlementScope.Organization,
                        MergeStrategy: EntitlementMergeStrategy.Sum,
                    },
                ],
            },
        ],
    };

    it('reads the plans of a subscription passed as selection', () => {
        const subscription = buildSubscription({ [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 2 });

        expect(
            createEntitlementResolverForSelection(catalog, subscription).quantityTotal(EntitlementName.MaxSpace)
        ).toBe(700);
    });

    it('reads a plan name passed as selection as a single unit of that plan', () => {
        expect(
            createEntitlementResolverForSelection(catalog, PLANS.MAIL_PRO).quantityTotal(EntitlementName.MaxSpace)
        ).toBe(500);
    });

    it('grants nothing for an undefined selection', () => {
        expect(createEntitlementResolverForSelection(catalog, undefined).quantityTotal(EntitlementName.MaxSpace)).toBe(
            0
        );
    });

    it('grants nothing for the free subscription', () => {
        expect(
            createEntitlementResolverForSelection(catalog, FREE_SUBSCRIPTION).quantityTotal(EntitlementName.MaxSpace)
        ).toBe(0);
    });
});

describe('isMspEligible', () => {
    // Types mirror the catalog: Pass Business is a switch, while the two subsidiary limits are Value
    // entitlements whose quantity is a real number (200 and 1000 on the MSP addon), not a 0/1 toggle.
    const passBusiness = (Quantity: 0 | 1): Entitlement => ({
        Name: EntitlementName.PassBusiness,
        Type: EntitlementType.Switch,
        Quantity,
        Scope: EntitlementScope.Organization,
    });

    const maxSubsidiaries = (Quantity: number): Entitlement => ({
        Name: EntitlementName.MaxSubsidiaries,
        Type: EntitlementType.Value,
        Quantity,
        Scope: EntitlementScope.Organization,
    });

    const maxMembersSubsidiaries = (Quantity: number): Entitlement => ({
        Name: EntitlementName.MaxMembersSubsidiaries,
        Type: EntitlementType.Value,
        Quantity,
        Scope: EntitlementScope.Organization,
    });

    const granted = [passBusiness(1), maxSubsidiaries(200), maxMembersSubsidiaries(1000)];

    // The plan advertises all three, so the catalog fold on its own would always say "eligible". Every case
    // below differs only in what the backend actually granted, which is what the check must follow.
    const catalog: EntitlementCatalog = {
        Plans: [
            {
                Name: PLANS.PASS_BUSINESS,
                Entitlements: granted.map((entitlement) => ({
                    ...entitlement,
                    MergeStrategy: EntitlementMergeStrategy.Max,
                })),
            },
        ],
        Addons: [],
    };

    const subscription = buildSubscription(PLANS.PASS_BUSINESS);

    const resolverGranting = (entitlements: Entitlement[]) =>
        createEntitlementResolverForOrgAndUser(catalog, makeEntitlements(entitlements), [subscription]);

    it('is true when the backend grants all three', () => {
        const resolver = resolverGranting(granted);

        expect(resolver.quantityTotal(EntitlementName.MaxSubsidiaries)).toBe(200);
        expect(resolver.quantityTotal(EntitlementName.MaxMembersSubsidiaries)).toBe(1000);
        expect(resolver.isMspEligible).toBe(true);
    });

    it('is false when the backend revoked Pass Business, even though the plan still advertises it', () => {
        const resolver = resolverGranting([passBusiness(0), maxSubsidiaries(200), maxMembersSubsidiaries(1000)]);

        // The catalog fold is blind to the revocation, which is why the gate must not be phrased against it
        // eslint-disable-next-line custom-rules/no-single-entitlement-condition -- contrasting the two data sources
        expect(resolver.hasMatchingSubscription({ includes: [EntitlementName.PassBusiness] })).toBe(true);
        expect(resolver.isMspEligible).toBe(false);
    });

    it('is false when a subsidiary limit is granted as zero', () => {
        const resolver = resolverGranting([passBusiness(1), maxSubsidiaries(0), maxMembersSubsidiaries(1000)]);

        expect(resolver.isMspEligible).toBe(false);
    });

    it('is false when a subsidiary limit is missing from the grants entirely', () => {
        const resolver = resolverGranting([passBusiness(1), maxSubsidiaries(200)]);

        expect(resolver.isMspEligible).toBe(false);
    });

    it('follows the member allocation for Pass Business, not the organization total', () => {
        const notAllocatedToThisMember = createEntitlementResolverForOrgAndUser(
            catalog,
            makeEntitlements([
                { ...passBusiness(1), Scope: EntitlementScope.MemberAssignable },
                maxSubsidiaries(200),
                maxMembersSubsidiaries(1000),
            ]),
            [subscription]
        );

        expect(notAllocatedToThisMember.quantityTotal(EntitlementName.PassBusiness)).toBe(1);
        expect(notAllocatedToThisMember.quantityForMember(EntitlementName.PassBusiness)).toBe(0);
        expect(notAllocatedToThisMember.isMspEligible).toBe(false);
    });

    it('is not offered on the selection resolver, which cannot answer a member-level question', () => {
        const selection = createEntitlementResolverForSelection(catalog, PLANS.PASS_BUSINESS);

        expect('isMspEligible' in selection).toBe(false);
    });
});

describe('createEntitlementResolverForOrgAndUser subscription queries', () => {
    const mailProCatalog: EntitlementCatalog = {
        Plans: [
            { Name: PLANS.MAIL_PRO, Entitlements: [switchEntry(EntitlementName.Business)] },
            { Name: PLANS.VPN2024, Entitlements: [switchEntry(EntitlementName.FlagsVpn)] },
        ],
        Addons: [],
    };

    const mailPro = buildSubscription(PLANS.MAIL_PRO);
    const vpn = buildSubscription(PLANS.VPN2024);

    const resolver = createEntitlementResolverForOrgAndUser(mailProCatalog, makeEntitlements([], [], []), [
        mailPro,
        vpn,
    ]);

    it('reports which subscription grants the requested entitlements', () => {
        // eslint-disable-next-line custom-rules/no-single-entitlement-condition -- testing `findSubscriptionsMatching` itself
        expect(resolver.findSubscriptionsMatching({ includes: [EntitlementName.FlagsVpn] })).toEqual({
            result: true,
            subscriptions: [vpn],
        });
    });

    it('reports no subscription when one alone does not grant everything requested', () => {
        expect(
            resolver.findSubscriptionsMatching({
                includes: [EntitlementName.Business, EntitlementName.FlagsVpn],
            })
        ).toEqual({ result: false, subscriptions: [] });
    });

    it('answers about the given selection through withSelection, not about the org', () => {
        const selected = resolver.withSelection(PLANS.VPN2024);

        expect(selected.hasVpn).toBe(true);
        expect(selected.isBusiness).toBe(false);
        expect(resolver.withSelection(PLANS.MAIL_PRO).isBusiness).toBe(true);
    });
});

/**
 * Besides a flat array, the resolver accepts a single (possibly free or undefined) subscription and normalizes it into
 * the array it works with. An empty `includes` condition matches every subscription, so `findSubscriptionsMatching`
 * reports that normalized array back in order.
 *
 * Multi-subscription users get their extra plans as `SecondarySubscriptions` nested inside the primary one. Until the
 * proper multi-subscription migration lands, this flattening is what makes those plans visible to the resolver.
 */
describe('createEntitlementResolverForOrgAndUser subscription input shapes', () => {
    const emptyEntitlements = makeEntitlements([], [], []);

    const normalizedSubscriptions = (subscriptions: Parameters<typeof createEntitlementResolverForOrgAndUser>[2]) =>
        createEntitlementResolverForOrgAndUser(
            emptyCatalog,
            emptyEntitlements,
            subscriptions
        ).findSubscriptionsMatching({
            includes: [],
        }).subscriptions;

    it('wraps a single paid subscription into an array', () => {
        const subscription = buildSubscription(PLANS.MAIL_PRO);

        expect(normalizedSubscriptions(subscription)).toEqual([subscription]);
    });

    it('drops a free subscription', () => {
        expect(normalizedSubscriptions(FREE_SUBSCRIPTION)).toEqual([]);
    });

    it('handles undefined subscription', () => {
        expect(normalizedSubscriptions(undefined)).toEqual([]);
    });

    it('keeps every secondary subscription, in order after the primary', () => {
        const lumo = buildSubscription(PLANS.LUMO);
        const vpn = buildSubscription(PLANS.VPN2024);
        const primary = buildSubscription(PLANS.MAIL_PRO, { SecondarySubscriptions: [lumo, vpn] });

        expect(normalizedSubscriptions(primary)).toEqual([primary, lumo, vpn]);
    });

    it('still requires a single subscription to grant every entitlement of a combined check', () => {
        const catalog: EntitlementCatalog = {
            Plans: [
                { Name: PLANS.MAIL_PRO, Entitlements: [switchEntry(EntitlementName.Business)] },
                { Name: PLANS.VPN2024, Entitlements: [switchEntry(EntitlementName.FlagsVpn)] },
            ],
            Addons: [],
        };
        const vpn = buildSubscription(PLANS.VPN2024);
        const mailPro = buildSubscription(PLANS.MAIL_PRO, { SecondarySubscriptions: [vpn] });

        const resolver = createEntitlementResolverForOrgAndUser(catalog, emptyEntitlements, mailPro);

        // Business comes from the primary and VPN from the secondary, so no one subscription grants both
        expect(resolver.isVpnBusiness).toBe(false);
    });
});
