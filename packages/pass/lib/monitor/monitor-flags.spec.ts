import {
    buildExcludeAllFlags,
    buildIgnoreCheckFlags,
    buildIncludeAllFlags,
    buildRestoreCheckFlags,
} from './monitor-flags';
import { MonitorCheckType } from './types';

describe('monitor flag builders', () => {
    test('`buildIgnoreCheckFlags` sets a single skip flag', () => {
        expect(buildIgnoreCheckFlags(MonitorCheckType.WEAK)).toEqual({ SkipWeakPasswordCheck: true });
        expect(buildIgnoreCheckFlags(MonitorCheckType.MISSING_2FA)).toEqual({ Skip2FACheck: true });
    });

    test('`buildRestoreCheckFlags` clears a single skip flag', () => {
        expect(buildRestoreCheckFlags(MonitorCheckType.REUSED)).toEqual({ SkipReusedPasswordCheck: false });
        expect(buildRestoreCheckFlags(MonitorCheckType.COMPROMISED)).toEqual({ SkipCompromisedPasswordCheck: false });
    });

    test('`buildRestoreCheckFlags` on legacy SkipHealthCheck-only exclusion restores a single check', () => {
        expect(buildRestoreCheckFlags(MonitorCheckType.WEAK, { fullyExcluded: true })).toEqual({
            SkipHealthCheck: false,
            SkipWeakPasswordCheck: false,
            SkipCompromisedPasswordCheck: true,
            SkipReusedPasswordCheck: true,
            Skip2FACheck: true,
        });
    });

    test('`buildExcludeAllFlags` sets every monitor skip flag', () => {
        expect(buildExcludeAllFlags()).toEqual({
            SkipHealthCheck: true,
            SkipWeakPasswordCheck: true,
            SkipCompromisedPasswordCheck: true,
            SkipReusedPasswordCheck: true,
            Skip2FACheck: true,
        });
    });

    test('`buildIncludeAllFlags` clears every monitor skip flag', () => {
        expect(buildIncludeAllFlags()).toEqual({
            SkipHealthCheck: false,
            SkipWeakPasswordCheck: false,
            SkipCompromisedPasswordCheck: false,
            SkipReusedPasswordCheck: false,
            Skip2FACheck: false,
        });
    });
});
