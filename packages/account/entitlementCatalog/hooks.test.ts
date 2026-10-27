import { renderHook } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';
import {
    type CataloguedPlan,
    prodCatalogGrants,
    toOrganizationEntitlement,
} from '@proton/payments/testing/prodCatalogGrants';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import { buildUser } from '@proton/shared/testing/buildUser';

import { useAllSubscriptions } from '../allSubscriptions/hooks';
import { useAllEntitlements } from '../entitlements/hooks';
import { useOrganization } from '../organization/hooks';
import { useUser } from '../user/hooks';
import { useEntitlementChecksForOrgAndUser } from './hooks';

const mockUseEntitlementCatalog = jest.fn();
const mockUseAllEntitlements = jest.mocked(useAllEntitlements);
const mockUseAllSubscriptions = jest.mocked(useAllSubscriptions);
const mockUseUser = jest.mocked(useUser);
const mockUseOrganization = jest.mocked(useOrganization);

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
    useGetUser: jest.fn(),
}));

jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: jest.fn(),
    useGetOrganization: jest.fn(),
}));

jest.mock('@proton/account/entitlements/hooks', () => ({
    useAllEntitlements: jest.fn(),
    useGetAllEntitlements: jest.fn(),
}));

jest.mock('@proton/account/allSubscriptions/hooks', () => ({
    useAllSubscriptions: jest.fn(),
    useGetAllSubscriptions: jest.fn(),
}));

jest.mock('@proton/redux-utilities/hooks', () => ({
    createHooks: () => ({
        useValue: (...args: any[]) => mockUseEntitlementCatalog(...args),
        useGet: jest.fn(),
    }),
}));

beforeEach(() => {
    mockUseEntitlementCatalog.mockReturnValue([undefined as any, false]);
    mockUseAllSubscriptions.mockReturnValue([undefined, false]);
    mockUseUser.mockReturnValue([buildUser(), false]);
    mockUseOrganization.mockReturnValue([undefined, false]);
});

describe('useEntitlements', () => {
    it('returns loading=true and resolver with quantity 0 when entitlements are loading', () => {
        mockUseAllEntitlements.mockReturnValue([undefined, true]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[1]).toBe(true);
        expect(result.current[0].resolveForMember(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Organization,
        });
    });

    it('resolver.resolve reads from OrganizationEntitlements for organization-scope entitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Organization,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[0].resolveForMember(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Organization,
        });
        expect(result.current[1]).toBe(false);
    });

    it('resolver.resolve reads from MemberEntitlements for member-assignable entitlements', () => {
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
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[0].resolveForMember(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.MemberAssignable,
        });
    });

    it('resolver.resolveTotal always reads from OrganizationEntitlements', () => {
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
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[0].resolveTotal(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.MemberAssignable,
        });
    });

    it('resolver reference is stable when entitlements data has not changed', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Organization,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result, rerender } = renderHook(() => useEntitlementChecksForOrgAndUser());
        const firstResolver = result.current[0];

        rerender();

        expect(result.current[0]).toBe(firstResolver);
    });

    it('resolver reference changes when entitlements data changes', () => {
        const entitlements1 = makeEntitlements([
            {
                Name: EntitlementName.MaxSpace,
                Quantity: 1000,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Organization,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements1, false]);

        const { result, rerender } = renderHook(() => useEntitlementChecksForOrgAndUser());
        const firstResolver = result.current[0];

        const entitlements2 = makeEntitlements([
            {
                Name: EntitlementName.MaxSpace,
                Quantity: 2000,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Organization,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements2, false]);

        rerender();

        expect(result.current[0]).not.toBe(firstResolver);
    });

    it('exposes the factory accessors wired to allEntitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Organization,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[0].quantityForMember(EntitlementName.Business)).toBe(1);
        expect(result.current[0].quantityTotal(EntitlementName.Business)).toBe(1);
    });

    it('returns loading=true while the subscriptions are loading', () => {
        mockUseAllEntitlements.mockReturnValue([makeEntitlements(), false]);
        mockUseAllSubscriptions.mockReturnValue([undefined, true]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[1]).toBe(true);
    });

    it('matches subscription checks against every subscription', () => {
        const catalog = buildEntitlementCatalog({
            [PLANS.MAIL]: [EntitlementName.FlagsInbox],
            [PLANS.VPN_BUSINESS]: [EntitlementName.Business, EntitlementName.FlagsVpn],
        });
        mockUseEntitlementCatalog.mockReturnValue([catalog, false]);
        mockUseAllEntitlements.mockReturnValue([makeEntitlements(), false]);
        mockUseAllSubscriptions.mockReturnValue([
            [buildSubscription(PLANS.MAIL), buildSubscription(PLANS.VPN_BUSINESS)],
            false,
        ]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[0].isVpnB2B).toBe(true);
        expect(result.current[0].isPassB2B).toBe(false);
    });

    it('returns loading=true while the organization is loading', () => {
        mockUseAllEntitlements.mockReturnValue([makeEntitlements(), false]);
        mockUseOrganization.mockReturnValue([undefined, true]);

        const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

        expect(result.current[1]).toBe(true);
    });

    describe('users who cannot read the subscriptions of their organization', () => {
        const mockOrganizationWithPlan = (plan: CataloguedPlan, organization: Partial<OrganizationExtended>) => {
            mockUseEntitlementCatalog.mockReturnValue([buildEntitlementCatalog(prodCatalogGrants), false]);
            mockUseAllEntitlements.mockReturnValue([
                makeEntitlements(prodCatalogGrants[plan].map(toOrganizationEntitlement)),
                false,
            ]);
            mockUseAllSubscriptions.mockReturnValue([[], false]);
            mockUseOrganization.mockReturnValue([organization as OrganizationExtended, false]);
        };

        it.each([
            { case: 'a member', role: USER_ROLES.MEMBER_ROLE, IsSubsidiary: false },
            { case: 'a member of an MSP subsidiary', role: USER_ROLES.MEMBER_ROLE, IsSubsidiary: true },
            { case: 'an admin of an MSP subsidiary', role: USER_ROLES.ADMIN_ROLE, IsSubsidiary: true },
        ] as const)(
            'matches subscription checks against the organization entitlements for $case',
            ({ role, IsSubsidiary }) => {
                mockOrganizationWithPlan(PLANS.PASS_BUSINESS, { IsSubsidiary });
                mockUseUser.mockReturnValue([buildUser({ Role: role }), false]);

                const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

                expect(result.current[0].isPassB2B).toBe(true);
                expect(result.current[0].isVpnB2B).toBe(false);
            }
        );

        it('does not match subscription checks for an admin whose subscriptions are empty', () => {
            mockOrganizationWithPlan(PLANS.PASS_BUSINESS, { IsSubsidiary: false });
            mockUseUser.mockReturnValue([buildUser({ Role: USER_ROLES.ADMIN_ROLE }), false]);

            const { result } = renderHook(() => useEntitlementChecksForOrgAndUser());

            expect(result.current[0].isPassB2B).toBe(false);
            expect(result.current[0].isB2B).toBe(true);
        });
    });
});
