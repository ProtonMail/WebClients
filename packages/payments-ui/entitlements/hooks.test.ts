import { renderHook } from '@testing-library/react-hooks';

import { useAllEntitlements, useGetAllEntitlements } from '@proton/account/entitlements/hooks';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';

import { useEntitlementChecks, useGetEntitlements } from './hooks';

jest.mock('@proton/account/entitlements/hooks', () => ({
    useAllEntitlements: jest.fn(),
    useGetAllEntitlements: jest.fn(),
}));

const mockUseAllEntitlements = jest.mocked(useAllEntitlements);
const mockUseGetAllEntitlements = jest.mocked(useGetAllEntitlements);

describe('useEntitlements', () => {
    it('returns loading=true and resolver with quantity 0 when entitlements are loading', () => {
        mockUseAllEntitlements.mockReturnValue([undefined, true]);

        const { result } = renderHook(() => useEntitlementChecks());

        expect(result.current[1]).toBe(true);
        expect(result.current[0].resolve(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
    });

    it('resolver.resolve reads from OrganizationEntitlements for global entitlements', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecks());

        expect(result.current[0].resolve(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Global,
        });
        expect(result.current[1]).toBe(false);
    });

    it('resolver.resolve reads from MemberEntitlements for distributed entitlements', () => {
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
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecks());

        expect(result.current[0].resolve(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.Distributed,
        });
    });

    it('resolver.resolveOrg always reads from OrganizationEntitlements', () => {
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
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecks());

        expect(result.current[0].resolveOrg(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.Distributed,
        });
    });

    it('resolver reference is stable when entitlements data has not changed', () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result, rerender } = renderHook(() => useEntitlementChecks());
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
                Scope: EntitlementScope.Global,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements1, false]);

        const { result, rerender } = renderHook(() => useEntitlementChecks());
        const firstResolver = result.current[0];

        const entitlements2 = makeEntitlements([
            {
                Name: EntitlementName.MaxSpace,
                Quantity: 2000,
                Type: EntitlementType.Value,
                Scope: EntitlementScope.Global,
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
                Scope: EntitlementScope.Global,
            },
        ]);
        mockUseAllEntitlements.mockReturnValue([entitlements, false]);

        const { result } = renderHook(() => useEntitlementChecks());

        expect(result.current[0].quantity(EntitlementName.Business)).toBe(1);
        expect(result.current[0].quantityOrg(EntitlementName.Business)).toBe(1);
    });
});

describe('useGetEntitlements', () => {
    it('returns a function that resolves to a resolver', async () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            },
        ]);
        mockUseGetAllEntitlements.mockReturnValue(() => Promise.resolve(entitlements));

        const { result } = renderHook(() => useGetEntitlements());
        const resolver = await result.current();

        expect(resolver.resolve(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 1,
            scope: EntitlementScope.Global,
        });
    });

    it('resolver.resolve reads from MemberEntitlements for distributed entitlements', async () => {
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
        mockUseGetAllEntitlements.mockReturnValue(() => Promise.resolve(entitlements));

        const { result } = renderHook(() => useGetEntitlements());
        const resolver = await result.current();

        expect(resolver.resolve(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.Distributed,
        });
    });

    it('resolver.resolveOrg always reads from OrganizationEntitlements', async () => {
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
        mockUseGetAllEntitlements.mockReturnValue(() => Promise.resolve(entitlements));

        const { result } = renderHook(() => useGetEntitlements());
        const resolver = await result.current();

        expect(resolver.resolveOrg(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.Distributed,
        });
    });

    it('returns quantity 0 when entitlements resolve to undefined', async () => {
        mockUseGetAllEntitlements.mockReturnValue(() => Promise.resolve(undefined as any));

        const { result } = renderHook(() => useGetEntitlements());
        const resolver = await result.current();

        expect(resolver.resolve(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
    });

    it('exposes the factory accessors wired to the awaited entitlements', async () => {
        const entitlements = makeEntitlements([
            {
                Name: EntitlementName.Business,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            },
        ]);
        mockUseGetAllEntitlements.mockReturnValue(() => Promise.resolve(entitlements));

        const { result } = renderHook(() => useGetEntitlements());
        const resolver = await result.current();

        expect(resolver.quantity(EntitlementName.Business)).toBe(1);
        expect(resolver.quantityOrg(EntitlementName.Business)).toBe(1);
    });
});
