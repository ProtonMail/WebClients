import { buildSubscription } from '../../testing/buildSubscription';
import { makeEntitlements } from '../../testing/makeEntitlements';
import { PLANS } from '../constants';
import { EntitlementName } from './entitlement-names';
import {
    type EntitlementsPerSubscription,
    checkConditions,
    findSubscriptionsMatching,
    getEntitlementQuantityForMember,
    getTotalEntitlementQuantity,
    hasGrantedEntitlement,
    resolveEntitlementForMember,
    resolveGrantedEntitlement,
    resolveTotalEntitlement,
} from './helpers';
import { EntitlementScope, EntitlementType, type ResolvedEntitlement } from './interface';

describe('resolveEntitlementForMember', () => {
    it('returns quantity 0 and correct scope when entitlements is undefined', () => {
        expect(resolveEntitlementForMember(undefined, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
    });

    it('reads from OrganizationEntitlements for organization-scope entitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Organization,
            },
        ]);
        expect(resolveEntitlementForMember(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Organization,
        });
    });

    it('reads from MemberEntitlements for member-assignable entitlements', () => {
        const entitlements = makeEntitlements(
            [
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
        expect(resolveEntitlementForMember(entitlements, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.MemberAssignable,
        });
    });

    it('returns quantity 0 when the entitlement is absent in its scope', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Sso,
                Quantity: 1,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Organization,
            },
        ]);
        expect(resolveEntitlementForMember(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
    });

    it('returns quantity 0 for member-assignable entitlement absent from MemberEntitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.MaxSpace,
                Quantity: 500,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.MemberAssignable,
            },
        ]);
        expect(resolveEntitlementForMember(entitlements, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 0,
            scope: EntitlementScope.MemberAssignable,
        });
    });
    it('reads the member allocation of a member-assignable entitlement absent from the org list', () => {
        const entitlements = makeEntitlements(
            [],
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
        expect(resolveEntitlementForMember(entitlements, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.MemberAssignable,
        });
    });

    it('reads the org quantity for a Member-scoped entitlement not allocated per member', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.MaxEmergencyAccessContacts,
                Quantity: 5,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Member,
            },
        ]);
        expect(resolveEntitlementForMember(entitlements, EntitlementName.MaxEmergencyAccessContacts)).toEqual({
            name: EntitlementName.MaxEmergencyAccessContacts,
            quantity: 5,
            scope: EntitlementScope.Member,
        });
    });

    it('prefers the per-member override for a Member-scoped entitlement', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.MaxEmergencyAccessContacts,
                    Quantity: 5,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Member,
                },
            ],
            [],
            [
                {
                    Name: EntitlementName.MaxEmergencyAccessContacts,
                    Quantity: 10,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Member,
                },
            ]
        );
        expect(resolveEntitlementForMember(entitlements, EntitlementName.MaxEmergencyAccessContacts)).toEqual({
            name: EntitlementName.MaxEmergencyAccessContacts,
            quantity: 10,
            scope: EntitlementScope.Member,
        });
    });

    it('keeps a zero-valued per-member override for a Member-scoped entitlement', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.MaxEmergencyAccessContacts,
                    Quantity: 5,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Member,
                },
            ],
            [],
            [
                {
                    Name: EntitlementName.MaxEmergencyAccessContacts,
                    Quantity: 0,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Member,
                },
            ]
        );
        expect(resolveEntitlementForMember(entitlements, EntitlementName.MaxEmergencyAccessContacts)).toEqual({
            name: EntitlementName.MaxEmergencyAccessContacts,
            quantity: 0,
            scope: EntitlementScope.Member,
        });
    });
});

describe('resolveTotalEntitlement', () => {
    it('returns quantity 0 and scope Organization when entitlements is undefined', () => {
        expect(resolveTotalEntitlement(undefined, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
    });

    it('always reads from OrganizationEntitlements, even for member-assignable names', () => {
        const entitlements = makeEntitlements(
            [
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
        expect(resolveTotalEntitlement(entitlements, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.MemberAssignable,
        });
    });

    it('returns the scope from the Entitlement.Scope property even when reading org data', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Organization,
            },
        ]);
        expect(resolveTotalEntitlement(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Organization,
        });
    });

    it('returns quantity 0 when entitlement is absent from OrganizationEntitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Sso,
                Quantity: 1,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Organization,
            },
        ]);
        expect(resolveTotalEntitlement(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
    });
});

describe('getEntitlementQuantityFromScope', () => {
    it('returns 0 when entitlements is undefined', () => {
        expect(getEntitlementQuantityForMember(undefined, EntitlementName.Business)).toBe(0);
    });

    it('reads from OrganizationEntitlements for organization-scope entitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Organization,
            },
        ]);
        expect(getEntitlementQuantityForMember(entitlements, EntitlementName.Business)).toBe(1);
    });

    it('reads from MemberEntitlements for member-assignable entitlements', () => {
        const entitlements = makeEntitlements(
            [
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
        expect(getEntitlementQuantityForMember(entitlements, EntitlementName.MaxSpace)).toBe(100);
    });

    it('returns 0 when the entitlement is absent in its scope', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Sso,
                Quantity: 1,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Organization,
            },
        ]);
        expect(getEntitlementQuantityForMember(entitlements, EntitlementName.Business)).toBe(0);
    });
});

describe('getTotalEntitlementQuantity', () => {
    it('returns 0 when entitlements is undefined', () => {
        expect(getTotalEntitlementQuantity(undefined, EntitlementName.MaxSpace)).toBe(0);
    });

    it('always reads from OrganizationEntitlements, even for member-assignable names', () => {
        const entitlements = makeEntitlements(
            [
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
        expect(getTotalEntitlementQuantity(entitlements, EntitlementName.MaxSpace)).toBe(500);
    });

    it('returns 0 when entitlement is absent from OrganizationEntitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Sso,
                Quantity: 1,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Organization,
            },
        ]);
        expect(getTotalEntitlementQuantity(entitlements, EntitlementName.Business)).toBe(0);
    });
});

describe('resolveGrantedEntitlement', () => {
    const grants: ResolvedEntitlement[] = [
        { name: EntitlementName.MaxSpace, quantity: 500, scope: EntitlementScope.MemberAssignable },
        { name: EntitlementName.Business, quantity: 0, scope: EntitlementScope.Organization },
    ];

    it('returns the matching folded grant', () => {
        expect(resolveGrantedEntitlement(grants, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.MemberAssignable,
        });
    });

    it('falls back to a not-granted organization-scoped entry', () => {
        expect(resolveGrantedEntitlement(grants, EntitlementName.Sentinel)).toEqual({
            name: EntitlementName.Sentinel,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
    });

    it('reports a zero-quantity grant as not granted', () => {
        expect(hasGrantedEntitlement(grants, EntitlementName.Business)).toBe(false);
        expect(hasGrantedEntitlement(grants, EntitlementName.MaxSpace)).toBe(true);
        expect(hasGrantedEntitlement(grants, EntitlementName.Sentinel)).toBe(false);
    });
});

describe('checkConditions', () => {
    const granted = (name: EntitlementName, quantity = 1): ResolvedEntitlement => ({
        name,
        quantity,
        scope: EntitlementScope.Organization,
    });

    it('requires every included entitlement to be granted', () => {
        const entitlements = [granted(EntitlementName.MultiUser), granted(EntitlementName.Business)];

        expect(checkConditions({ includes: [EntitlementName.MultiUser, EntitlementName.Business] }, entitlements)).toBe(
            true
        );
        expect(checkConditions({ includes: [EntitlementName.MultiUser, EntitlementName.Sentinel] }, entitlements)).toBe(
            false
        );
    });

    it('is true for empty includes and no excludes', () => {
        expect(checkConditions({ includes: [] }, [])).toBe(true);
        expect(checkConditions({ includes: [] }, [granted(EntitlementName.Business)])).toBe(true);
    });

    it('rejects the selection when an excluded entitlement is granted', () => {
        const entitlements = [granted(EntitlementName.MultiUser), granted(EntitlementName.Business)];

        expect(
            checkConditions(
                { includes: [EntitlementName.MultiUser], excludes: [EntitlementName.Business] },
                entitlements
            )
        ).toBe(false);
        expect(
            checkConditions(
                { includes: [EntitlementName.MultiUser], excludes: [EntitlementName.Sentinel] },
                entitlements
            )
        ).toBe(true);
    });

    it('treats an empty excludes list as no exclusion', () => {
        expect(
            checkConditions({ includes: [EntitlementName.Business], excludes: [] }, [granted(EntitlementName.Business)])
        ).toBe(true);
    });

    it('is false for an excludes-only condition, however the excluded entitlement stands', () => {
        expect(checkConditions({ includes: [], excludes: [EntitlementName.Business] }, [])).toBe(false);
        expect(
            checkConditions({ includes: [], excludes: [EntitlementName.Business] }, [granted(EntitlementName.Business)])
        ).toBe(false);
        expect(
            checkConditions({ includes: [], excludes: [EntitlementName.Business] }, [
                granted(EntitlementName.MultiUser),
            ])
        ).toBe(false);
    });

    it('lets a quantity-0 entry satisfy neither includes nor excludes', () => {
        const entitlements = [granted(EntitlementName.Business, 0), granted(EntitlementName.MultiUser)];

        expect(checkConditions({ includes: [EntitlementName.Business] }, entitlements)).toBe(false);
        expect(
            checkConditions(
                { includes: [EntitlementName.MultiUser], excludes: [EntitlementName.Business] },
                entitlements
            )
        ).toBe(true);
    });
});

describe('findSubscriptionsMatching', () => {
    const mailPro = buildSubscription(PLANS.MAIL_PRO);
    const vpn = buildSubscription(PLANS.VPN2024);

    const perSubscription: EntitlementsPerSubscription = [
        {
            subscription: mailPro,
            entitlements: [
                { name: EntitlementName.Business, quantity: 1, scope: EntitlementScope.Organization },
                { name: EntitlementName.MultiUser, quantity: 1, scope: EntitlementScope.Organization },
            ],
        },
        {
            subscription: vpn,
            entitlements: [{ name: EntitlementName.FlagsVpn, quantity: 1, scope: EntitlementScope.Organization }],
        },
    ];

    it('returns only the subscriptions satisfying all conditions', () => {
        const { result, subscriptions } = findSubscriptionsMatching(
            { includes: [EntitlementName.Business, EntitlementName.MultiUser] },
            perSubscription
        );

        expect(result).toBe(true);
        expect(subscriptions).toEqual([mailPro]);
    });

    it('does not combine entitlements across subscriptions', () => {
        expect(
            findSubscriptionsMatching(
                { includes: [EntitlementName.Business, EntitlementName.FlagsVpn] },
                perSubscription
            )
        ).toEqual({ result: false, subscriptions: [] });
    });

    it('returns every matching subscription when the conditions are empty', () => {
        const { result, subscriptions } = findSubscriptionsMatching({ includes: [] }, perSubscription);

        expect(result).toBe(true);
        expect(subscriptions).toEqual([mailPro, vpn]);
    });

    it('returns no match for an empty list of subscriptions', () => {
        // eslint-disable-next-line custom-rules/no-single-entitlement-condition -- testing `findSubscriptionsMatching` itself
        expect(findSubscriptionsMatching({ includes: [EntitlementName.Business] }, [])).toEqual({
            result: false,
            subscriptions: [],
        });
    });
});
