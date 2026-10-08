import { renderHook } from '@testing-library/react';

import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';

import { useAllEntitlements } from '../entitlements/hooks';
import { useGetSubscription, useSubscription } from '../subscription/hooks';
import { useEntitlementChecksForOrgAndUser } from './hooks';

const mockUseEntitlementCatalog = jest.fn();
const mockUseAllEntitlements = jest.mocked(useAllEntitlements);
const mockUseSubscription = jest.mocked(useSubscription);
const mockUseGetSubscription = jest.mocked(useGetSubscription);

jest.mock('@proton/account/entitlements/hooks', () => ({
    useAllEntitlements: jest.fn(),
    useGetAllEntitlements: jest.fn(),
}));

jest.mock('@proton/account/subscription/hooks', () => ({
    useSubscription: jest.fn(),
    useGetSubscription: jest.fn(),
}));

jest.mock('@proton/redux-utilities/hooks', () => ({
    createHooks: () => ({
        useValue: (...args: any[]) => mockUseEntitlementCatalog(...args),
        useGet: jest.fn(),
    }),
}));

beforeEach(() => {
    mockUseEntitlementCatalog.mockReturnValue([undefined as any, false]);
    mockUseSubscription.mockReturnValue([undefined as any, false]);
    mockUseGetSubscription.mockReturnValue(() => Promise.resolve(undefined as any));
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
});
