import type { ItemRevision } from '@proton/pass/types';

import { isAliasDisabled, isBreached, isHealthCheckSkipped, isMonitored } from './item.predicates';

describe('item predicates', () => {
    test('`isMonitored`', () => {
        expect(isMonitored({ flags: parseInt('000', 2) } as ItemRevision)).toBe(true);
        expect(isMonitored({ flags: parseInt('010', 2) } as ItemRevision)).toBe(true);
        expect(isMonitored({ flags: parseInt('110', 2) } as ItemRevision)).toBe(true);
        expect(isMonitored({ flags: parseInt('100', 2) } as ItemRevision)).toBe(true);
        expect(isMonitored({ flags: parseInt('001', 2) } as ItemRevision)).toBe(false);
        expect(isMonitored({ flags: parseInt('011', 2) } as ItemRevision)).toBe(false);
        expect(isMonitored({ flags: parseInt('101', 2) } as ItemRevision)).toBe(false);
        expect(isMonitored({ flags: parseInt('111', 2) } as ItemRevision)).toBe(false);
    });

    test('`isHealthCheckSkipped`', () => {
        expect(isHealthCheckSkipped({ flags: parseInt('000', 2) } as ItemRevision)).toBe(false);
        expect(isHealthCheckSkipped({ flags: parseInt('010', 2) } as ItemRevision)).toBe(false);
        expect(isHealthCheckSkipped({ flags: parseInt('110', 2) } as ItemRevision)).toBe(false);
        expect(isHealthCheckSkipped({ flags: parseInt('100', 2) } as ItemRevision)).toBe(false);
        expect(isHealthCheckSkipped({ flags: parseInt('001', 2) } as ItemRevision)).toBe(true);
        expect(isHealthCheckSkipped({ flags: parseInt('011', 2) } as ItemRevision)).toBe(true);
        expect(isHealthCheckSkipped({ flags: parseInt('101', 2) } as ItemRevision)).toBe(true);
        expect(isHealthCheckSkipped({ flags: parseInt('111', 2) } as ItemRevision)).toBe(true);
    });

    test('`isBreached`', () => {
        expect(isBreached({ flags: parseInt('000', 2) } as ItemRevision)).toBe(false);
        expect(isBreached({ flags: parseInt('010', 2) } as ItemRevision)).toBe(true);
        expect(isBreached({ flags: parseInt('110', 2) } as ItemRevision)).toBe(true);
        expect(isBreached({ flags: parseInt('100', 2) } as ItemRevision)).toBe(false);
        expect(isBreached({ flags: parseInt('001', 2) } as ItemRevision)).toBe(false);
        expect(isBreached({ flags: parseInt('011', 2) } as ItemRevision)).toBe(true);
        expect(isBreached({ flags: parseInt('101', 2) } as ItemRevision)).toBe(false);
        expect(isBreached({ flags: parseInt('111', 2) } as ItemRevision)).toBe(true);
    });

    test('`isAliasDisabled`', () => {
        expect(isAliasDisabled({ flags: parseInt('000', 2) } as ItemRevision)).toBe(false);
        expect(isAliasDisabled({ flags: parseInt('010', 2) } as ItemRevision)).toBe(false);
        expect(isAliasDisabled({ flags: parseInt('110', 2) } as ItemRevision)).toBe(true);
        expect(isAliasDisabled({ flags: parseInt('100', 2) } as ItemRevision)).toBe(true);
        expect(isAliasDisabled({ flags: parseInt('001', 2) } as ItemRevision)).toBe(false);
        expect(isAliasDisabled({ flags: parseInt('011', 2) } as ItemRevision)).toBe(false);
        expect(isAliasDisabled({ flags: parseInt('101', 2) } as ItemRevision)).toBe(true);
        expect(isAliasDisabled({ flags: parseInt('111', 2) } as ItemRevision)).toBe(true);
    });
});
