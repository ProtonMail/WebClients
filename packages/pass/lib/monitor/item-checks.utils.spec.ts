import { ItemFlag } from '../../types/data/items';
import { createTestItem, createTestLogin } from '../../utils/tests/fixtures/items';
import { getVisibleItemMonitorChecks } from './item-checks.utils';
import { MonitorCheckType } from './types';

const createLogin = (flags = 0) => ({
    ...createTestItem('login'),
    flags,
});

describe('getVisibleItemMonitorChecks', () => {
    const allFailing: Record<MonitorCheckType, boolean> = {
        [MonitorCheckType.WEAK]: true,
        [MonitorCheckType.REUSED]: true,
        [MonitorCheckType.COMPROMISED]: true,
        [MonitorCheckType.MISSING_2FA]: true,
    };

    test('returns active failing checks in normal view', () => {
        const revision = createLogin();

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: true,
                excludedView: false,
                failing: allFailing,
                revision,
            })
        ).toEqual([
            MonitorCheckType.COMPROMISED,
            MonitorCheckType.WEAK,
            MonitorCheckType.REUSED,
            MonitorCheckType.MISSING_2FA,
        ]);
    });

    test('hides ignored checks in normal view', () => {
        const revision = createLogin(ItemFlag.Skip2FACheck);

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: true,
                excludedView: false,
                failing: allFailing,
                revision,
            })
        ).not.toContain(MonitorCheckType.MISSING_2FA);
    });

    test('shows per-check ignored 2FA in excluded view when the login has a domain', () => {
        const revision = createTestLogin({
            shareId: 'share',
            name: 'Test',
            urls: ['https://example.com'],
            flags: ItemFlag.Skip2FACheck,
        });

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: true,
                excludedView: true,
                failing: {
                    [MonitorCheckType.WEAK]: false,
                    [MonitorCheckType.REUSED]: false,
                    [MonitorCheckType.COMPROMISED]: false,
                    [MonitorCheckType.MISSING_2FA]: false,
                },
                revision,
            })
        ).toEqual([MonitorCheckType.MISSING_2FA]);
    });

    test('hides per-check ignored 2FA in excluded view when the login has no domain', () => {
        const revision = createLogin(ItemFlag.Skip2FACheck);

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: true,
                excludedView: true,
                failing: {
                    [MonitorCheckType.WEAK]: false,
                    [MonitorCheckType.REUSED]: false,
                    [MonitorCheckType.COMPROMISED]: false,
                    [MonitorCheckType.MISSING_2FA]: false,
                },
                revision,
            })
        ).toEqual([]);
    });

    test('hides compromised check when feature is disabled', () => {
        const revision = createLogin();

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: false,
                excludedView: false,
                failing: allFailing,
                revision,
            })
        ).not.toContain(MonitorCheckType.COMPROMISED);
    });

    test('shows applicable checks for globally excluded items in excluded view without relying on failing', () => {
        const revision = createTestLogin({
            shareId: 'share',
            name: 'Test',
            password: 'password',
            flags: ItemFlag.SkipHealthCheck,
        });

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: true,
                excludedView: true,
                failing: {
                    [MonitorCheckType.WEAK]: false,
                    [MonitorCheckType.REUSED]: false,
                    [MonitorCheckType.COMPROMISED]: false,
                    [MonitorCheckType.MISSING_2FA]: false,
                },
                revision,
            })
        ).toEqual([MonitorCheckType.COMPROMISED, MonitorCheckType.WEAK]);
    });

    test('shows reused for globally excluded items only when duplicates were failing', () => {
        const revision = createTestLogin({
            shareId: 'share',
            name: 'Test',
            password: 'password',
            flags: ItemFlag.SkipHealthCheck,
        });

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: true,
                excludedView: true,
                failing: {
                    [MonitorCheckType.WEAK]: false,
                    [MonitorCheckType.REUSED]: true,
                    [MonitorCheckType.COMPROMISED]: false,
                    [MonitorCheckType.MISSING_2FA]: false,
                },
                revision,
            })
        ).toContain(MonitorCheckType.REUSED);
    });

    test('hides 2FA for globally excluded logins without a domain when 2FA was not failing', () => {
        const revision = createLogin(ItemFlag.SkipHealthCheck);

        expect(
            getVisibleItemMonitorChecks({
                compromisedEnabled: true,
                excludedView: true,
                failing: {
                    [MonitorCheckType.WEAK]: false,
                    [MonitorCheckType.REUSED]: false,
                    [MonitorCheckType.COMPROMISED]: false,
                    [MonitorCheckType.MISSING_2FA]: false,
                },
                revision,
            })
        ).not.toContain(MonitorCheckType.MISSING_2FA);
    });
});
