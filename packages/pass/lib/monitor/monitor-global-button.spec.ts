import { ItemFlag } from '../../types/data/items';
import { createTestItem } from '../../utils/tests/fixtures/items';
import { getGlobalMonitorButtonMode } from './monitor-global-button';

const createLogin = (flags = 0) => ({
    ...createTestItem('login'),
    flags,
});

describe('getGlobalMonitorButtonMode', () => {
    describe('legacy (FF off)', () => {
        test('returns exclude when monitored', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 0,
                    perCheckExclusionEnabled: false,
                    revision: createLogin(),
                })
            ).toBe('exclude');
        });

        test('returns include when globally excluded', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 0,
                    perCheckExclusionEnabled: false,
                    revision: createLogin(ItemFlag.SkipHealthCheck),
                })
            ).toBe('include');
        });
    });

    describe('per-check exclusion (FF on)', () => {
        test('returns exclude when active warnings remain with partial ignore', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 1,
                    perCheckExclusionEnabled: true,
                    revision: createLogin(ItemFlag.Skip2FACheck),
                })
            ).toBe('exclude');
        });

        test('returns include when all warnings are ignored', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 0,
                    perCheckExclusionEnabled: true,
                    revision: createLogin(ItemFlag.Skip2FACheck),
                })
            ).toBe('include');
        });

        test('returns include when opened from excluded items scope', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 1,
                    perCheckExclusionEnabled: true,
                    revision: createLogin(ItemFlag.Skip2FACheck),
                    scope: 'monitor/excluded',
                })
            ).toBe('include');
        });

        test('returns include when globally excluded outside excluded scope', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 0,
                    perCheckExclusionEnabled: true,
                    revision: createLogin(ItemFlag.SkipHealthCheck),
                })
            ).toBe('include');
        });

        test('returns exclude when no exclusions and warnings are active', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 2,
                    perCheckExclusionEnabled: true,
                    revision: createLogin(),
                })
            ).toBe('exclude');
        });

        test('falls back to legacy label while checks are loading', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 0,
                    checksReady: false,
                    perCheckExclusionEnabled: true,
                    revision: createLogin(ItemFlag.Skip2FACheck),
                })
            ).toBe('exclude');
        });

        test('returns include from excluded scope while checks are loading', () => {
            expect(
                getGlobalMonitorButtonMode({
                    activeWarningCount: 0,
                    checksReady: false,
                    perCheckExclusionEnabled: true,
                    revision: createLogin(ItemFlag.Skip2FACheck),
                    scope: 'monitor/excluded',
                })
            ).toBe('include');
        });
    });
});
