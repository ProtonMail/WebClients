import { AddressType } from '@proton/pass/lib/monitor/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { type MonitorTableRow, sortMonitorTableRows } from './useBreachesTable';

jest.mock('@proton/pass/components/Monitor/MonitorProvider', () => ({}));

describe('useBreachTables', () => {
    describe('sortMonitorTableRows', () => {
        test('AddressType.ALIAS', () => {
            const createAliasRow = (breachCount: number, monitored: boolean): MonitorTableRow<AddressType.ALIAS> => ({
                breachCount,
                breached: breachCount > 0,
                email: 'test@proton.me',
                itemId: uniqueId(),
                monitored,
                shareId: uniqueId(),
                type: AddressType.ALIAS,
                usageCount: 10,
            });

            const a = createAliasRow(0, true);
            const b = createAliasRow(5, false);
            const c = createAliasRow(4, false);
            const d = createAliasRow(3, true);
            const e = createAliasRow(5, true);

            expect(sortMonitorTableRows([a, b, c, d, e])).toEqual([e, d, a, b, c]);
        });

        test('AddressType.PROTON', () => {
            const createProtonRow = (breachCount: number, monitored: boolean): MonitorTableRow<AddressType.PROTON> => ({
                addressId: uniqueId(),
                breachCount,
                breached: breachCount > 0,
                email: 'test@proton.me',
                monitored,
                type: AddressType.PROTON,
                usageCount: 10,
            });

            const a = createProtonRow(0, false);
            const b = createProtonRow(5, false);
            const c = createProtonRow(4, true);
            const d = createProtonRow(0, true);
            const e = createProtonRow(5, true);

            expect(sortMonitorTableRows([a, b, c, d, e])).toEqual([e, c, d, a, b]);
        });

        test('AddressType.CUSTOM', () => {
            const createProtonRow = (
                breachCount: number,
                monitored: boolean,
                verified: boolean
            ): MonitorTableRow<AddressType.CUSTOM> => ({
                addressId: uniqueId(),
                breachCount,
                breached: breachCount > 0,
                email: 'test@proton.me',
                monitored,
                suggestion: false,
                type: AddressType.CUSTOM,
                usageCount: 10,
                verified,
            });

            const a = createProtonRow(0, false, true);
            const b = createProtonRow(5, false, false);
            const c = createProtonRow(4, true, true);
            const d = createProtonRow(0, true, true);
            const e = createProtonRow(5, true, false);

            expect(sortMonitorTableRows([a, b, c, d, e])).toEqual([c, d, a, b, e]);
        });
    });
});
