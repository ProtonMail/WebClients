import { makeEntitlements } from '@proton/testing/builders/entitlements';

import { EntitlementName } from './entitlement-names';
import { EntitlementScope, EntitlementType } from './interface';
import { createEntitlementResolver } from './resolver';

describe('createEntitlementResolver', () => {
    it('exposes the full method surface', () => {
        const resolver = createEntitlementResolver(undefined);
        expect(typeof resolver.resolve).toBe('function');
        expect(typeof resolver.resolveOrg).toBe('function');
        expect(typeof resolver.quantity).toBe('function');
        expect(typeof resolver.quantityOrg).toBe('function');
    });

    it('handles undefined entitlements without throwing', () => {
        const resolver = createEntitlementResolver(undefined);
        expect(resolver.quantity(EntitlementName.MaxSpace)).toBe(0);
        expect(resolver.quantityOrg(EntitlementName.MaxSpace)).toBe(0);
        expect(resolver.resolve(EntitlementName.Business)).toEqual({
            name: EntitlementName.Business,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
        expect(resolver.resolveOrg(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 0,
            scope: EntitlementScope.Global,
        });
        expect(resolver.orgIsBusiness).toBe(false);
    });

    it('delegates each method to the captured entitlements', () => {
        const entitlements = makeEntitlements(
            [
                {
                    Name: EntitlementName.Business,
                    Quantity: 1,
                    Type: EntitlementType.Switch,
                    Scope: EntitlementScope.Global,
                },
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
        const resolver = createEntitlementResolver(entitlements);

        expect(resolver.resolve(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 100,
            scope: EntitlementScope.Distributed,
        });
        expect(resolver.resolveOrg(EntitlementName.MaxSpace)).toEqual({
            name: EntitlementName.MaxSpace,
            quantity: 500,
            scope: EntitlementScope.Distributed,
        });
        expect(resolver.quantity(EntitlementName.MaxSpace)).toBe(100);
        expect(resolver.quantityOrg(EntitlementName.MaxSpace)).toBe(500);
    });

    it('binds named checks built on top of the resolver under .checks', () => {
        const business = createEntitlementResolver(
            makeEntitlements(
                [
                    {
                        Name: EntitlementName.Business,
                        Quantity: 1,
                        Type: EntitlementType.Value,
                        Scope: EntitlementScope.Global,
                    },
                ],
                [],
                []
            )
        );
        const consumer = createEntitlementResolver(makeEntitlements([], [], []));

        expect(business.orgIsBusiness).toBe(true);
        expect(consumer.orgIsBusiness).toBe(false);
    });

    describe('orgIsMultiUser', () => {
        const switchEntitlement = (name: EntitlementName) => {
            return {
                Name: name,
                Quantity: 1 as const,
                Type: EntitlementType.Switch as const,
                Scope: EntitlementScope.Global,
            };
        };

        it('should be true for a multi-user personal plan', () => {
            const resolver = createEntitlementResolver(
                makeEntitlements([switchEntitlement(EntitlementName.MultiUser)])
            );

            expect(resolver.orgIsMultiUser).toBe(true);
        });

        it('should be true for a multi-user business plan', () => {
            const resolver = createEntitlementResolver(
                makeEntitlements([
                    switchEntitlement(EntitlementName.MultiUser),
                    switchEntitlement(EntitlementName.Business),
                ])
            );

            expect(resolver.orgIsMultiUser).toBe(true);
        });

        it('should be false for a single-user plan', () => {
            const resolver = createEntitlementResolver(makeEntitlements([]));

            expect(resolver.orgIsMultiUser).toBe(false);
        });

        it('should be false when there are no entitlements at all', () => {
            const resolver = createEntitlementResolver(undefined);

            expect(resolver.orgIsMultiUser).toBe(false);
        });
    });
});
