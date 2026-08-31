import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';

import { EntitlementName } from './entitlement-names';
import {
    getEntitlementQuantity,
    getOrgEntitlementQuantity,
    resolveEntitlement,
    resolveOrgEntitlement,
} from './helpers';
import { EntitlementScope, EntitlementType } from './interface';

describe('resolveEntitlement', () => {
    it('returns quantity 0 and correct scope when entitlements is undefined', () => {
        expect(resolveEntitlement(undefined, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
    });

    it('reads from OrganizationEntitlements for global entitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            },
        ]);
        expect(resolveEntitlement(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Global,
        });
    });

    it('reads from MemberEntitlements for distributed entitlements', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 500,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ],
            [],
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 100,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ]
        );
        expect(resolveEntitlement(entitlements, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.Distributed,
        });
    });

    it('returns quantity 0 when the entitlement is absent in its scope', () => {
        const entitlements = makeEntitlements([
            { Name: EntitlementName.Sso, Quantity: 1, Type: EntitlementType.Value, Scope: EntitlementScope.Global },
        ]);
        expect(resolveEntitlement(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
    });

    it('returns quantity 0 for distributed entitlement absent from MemberEntitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.MaxSpace,
                Quantity: 500,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Distributed,
            },
        ]);
        expect(resolveEntitlement(entitlements, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 0,
            scope: EntitlementScope.Distributed,
        });
    });
});

describe('resolveOrgEntitlement', () => {
    it('returns quantity 0 and scope Global when entitlements is undefined', () => {
        expect(resolveOrgEntitlement(undefined, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
    });

    it('always reads from OrganizationEntitlements, even for distributed names', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 500,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ],
            [],
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 100,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ]
        );
        expect(resolveOrgEntitlement(entitlements, EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.Distributed,
        });
    });

    it('returns the scope from the Entitlement.Scope property even when reading org data', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            },
        ]);
        expect(resolveOrgEntitlement(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Global,
        });
    });

    it('returns quantity 0 when entitlement is absent from OrganizationEntitlements', () => {
        const entitlements = makeEntitlements([
            { Name: EntitlementName.Sso, Quantity: 1, Type: EntitlementType.Value, Scope: EntitlementScope.Global },
        ]);
        expect(resolveOrgEntitlement(entitlements, EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
    });
});

describe('getEntitlementQuantityFromScope', () => {
    it('returns 0 when entitlements is undefined', () => {
        expect(getEntitlementQuantity(undefined, EntitlementName.Business)).toBe(0);
    });

    it('reads from OrganizationEntitlements for global entitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            },
        ]);
        expect(getEntitlementQuantity(entitlements, EntitlementName.Business)).toBe(1);
    });

    it('reads from MemberEntitlements for distributed entitlements', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 500,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ],
            [],
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 100,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ]
        );
        expect(getEntitlementQuantity(entitlements, EntitlementName.MaxSpace)).toBe(100);
    });

    it('returns 0 when the entitlement is absent in its scope', () => {
        const entitlements = makeEntitlements([
            { Name: EntitlementName.Sso, Quantity: 1, Type: EntitlementType.Value, Scope: EntitlementScope.Global },
        ]);
        expect(getEntitlementQuantity(entitlements, EntitlementName.Business)).toBe(0);
    });
});

describe('getOrgEntitlementQuantity', () => {
    it('returns 0 when entitlements is undefined', () => {
        expect(getOrgEntitlementQuantity(undefined, EntitlementName.MaxSpace)).toBe(0);
    });

    it('always reads from OrganizationEntitlements, even for distributed names', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 500,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ],
            [],
            [
                {
                    Name: EntitlementName.MaxSpace,
                    Quantity: 100,
                    Type: EntitlementType.Value,
                    Scope: EntitlementScope.Distributed,
                },
            ]
        );
        expect(getOrgEntitlementQuantity(entitlements, EntitlementName.MaxSpace)).toBe(500);
    });

    it('returns 0 when entitlement is absent from OrganizationEntitlements', () => {
        const entitlements = makeEntitlements([
            { Name: EntitlementName.Sso, Quantity: 1, Type: EntitlementType.Value, Scope: EntitlementScope.Global },
        ]);
        expect(getOrgEntitlementQuantity(entitlements, EntitlementName.Business)).toBe(0);
    });
});
