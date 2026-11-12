import type { ItemRevision, LoginItem } from '../../types/data/items';
import { ItemFlag, ItemState } from '../../types/data/items';
import { AutofillMode } from '../../types/protobuf';
import { MONITOR_CHECK_CONFIG, MonitorCheckType } from '../monitor/types';
import {
    hasAnyExclusion,
    hasAnyPerCheckIgnored,
    hasDomain,
    is2FACheckSkipped,
    isBreached,
    isCheckIgnored,
    isCompromisedPasswordCheckSkipped,
    isDisabledAlias,
    isEligibleForMonitorCheck,
    isFullyExcluded,
    isHealthCheckSkipped,
    isMonitored,
    isReusedPasswordCheckSkipped,
    isWeakPasswordCheckSkipped,
} from './item.predicates';

describe('item predicates', () => {
    test('`hasDomain`', () => {
        const withUrls = (autofillUrls: { url: string; mode: AutofillMode }[]) =>
            ({ data: { content: { autofillUrls } } }) as LoginItem;

        expect(hasDomain(withUrls([]))).toBe(false);
        expect(hasDomain(withUrls([{ url: 'https://example.com', mode: AutofillMode.Default }]))).toBe(true);
        /* a `Never` entry is a block rule, not a real autofill target */
        expect(hasDomain(withUrls([{ url: 'https://example.com', mode: AutofillMode.Never }]))).toBe(false);
        expect(
            hasDomain(
                withUrls([
                    { url: 'https://example.com', mode: AutofillMode.Never },
                    { url: 'https://example.com', mode: AutofillMode.Exact },
                ])
            )
        ).toBe(true);
    });

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
        expect(isDisabledAlias({ flags: parseInt('000', 2) } as ItemRevision)).toBe(false);
        expect(isDisabledAlias({ flags: parseInt('010', 2) } as ItemRevision)).toBe(false);
        expect(isDisabledAlias({ flags: parseInt('110', 2) } as ItemRevision)).toBe(true);
        expect(isDisabledAlias({ flags: parseInt('100', 2) } as ItemRevision)).toBe(true);
        expect(isDisabledAlias({ flags: parseInt('001', 2) } as ItemRevision)).toBe(false);
        expect(isDisabledAlias({ flags: parseInt('011', 2) } as ItemRevision)).toBe(false);
        expect(isDisabledAlias({ flags: parseInt('101', 2) } as ItemRevision)).toBe(true);
        expect(isDisabledAlias({ flags: parseInt('111', 2) } as ItemRevision)).toBe(true);
    });

    test('per-check skip flags', () => {
        expect(isWeakPasswordCheckSkipped({ flags: ItemFlag.SkipWeakPasswordCheck } as ItemRevision)).toBe(true);
        expect(
            isCompromisedPasswordCheckSkipped({ flags: ItemFlag.SkipCompromisedPasswordCheck } as ItemRevision)
        ).toBe(true);
        expect(isReusedPasswordCheckSkipped({ flags: ItemFlag.SkipReusedPasswordCheck } as ItemRevision)).toBe(true);
        expect(is2FACheckSkipped({ flags: ItemFlag.Skip2FACheck } as ItemRevision)).toBe(true);
        expect(isWeakPasswordCheckSkipped({ flags: 0 } as ItemRevision)).toBe(false);

        const unrelatedFlags = ItemFlag.EmailBreached | ItemFlag.Skip2FACheck;
        expect(isWeakPasswordCheckSkipped({ flags: unrelatedFlags } as ItemRevision)).toBe(false);
        expect(is2FACheckSkipped({ flags: unrelatedFlags } as ItemRevision)).toBe(true);
    });

    test('`isFullyExcluded`', () => {
        expect(isFullyExcluded({ flags: ItemFlag.SkipHealthCheck } as ItemRevision)).toBe(true);
        expect(isFullyExcluded({ flags: ItemFlag.SkipWeakPasswordCheck } as ItemRevision)).toBe(false);
    });

    test('`isCheckIgnored`', () => {
        const globallyExcluded = { flags: ItemFlag.SkipHealthCheck } as ItemRevision;
        expect(isCheckIgnored(MonitorCheckType.WEAK)(globallyExcluded)).toBe(true);
        expect(isCheckIgnored(MonitorCheckType.MISSING_2FA)(globallyExcluded)).toBe(true);

        const weakOnly = { flags: ItemFlag.SkipWeakPasswordCheck } as ItemRevision;
        expect(isCheckIgnored(MonitorCheckType.WEAK)(weakOnly)).toBe(true);
        expect(isCheckIgnored(MonitorCheckType.MISSING_2FA)(weakOnly)).toBe(false);
    });

    test('`isEligibleForMonitorCheck`', () => {
        const active = { flags: 0, state: ItemState.Active } as ItemRevision;
        const weakIgnored = { flags: ItemFlag.SkipWeakPasswordCheck, state: ItemState.Active } as ItemRevision;

        expect(isEligibleForMonitorCheck(MonitorCheckType.WEAK)(active)).toBe(true);
        expect(isEligibleForMonitorCheck(MonitorCheckType.WEAK)(weakIgnored)).toBe(false);
    });

    test('`hasAnyPerCheckIgnored` and `hasAnyExclusion`', () => {
        expect(hasAnyPerCheckIgnored({ flags: 0 } as ItemRevision)).toBe(false);
        expect(hasAnyExclusion({ flags: 0 } as ItemRevision)).toBe(false);

        const weakOnly = { flags: ItemFlag.SkipWeakPasswordCheck } as ItemRevision;
        expect(hasAnyPerCheckIgnored(weakOnly)).toBe(true);
        expect(hasAnyExclusion(weakOnly)).toBe(true);

        const globalOnly = { flags: ItemFlag.SkipHealthCheck } as ItemRevision;
        expect(hasAnyPerCheckIgnored(globalOnly)).toBe(false);
        expect(hasAnyExclusion(globalOnly)).toBe(true);
    });

    test('`MONITOR_CHECK_CONFIG` maps every check type to a flag and API key', () => {
        for (const type of Object.values(MonitorCheckType)) {
            const { flag, apiKey } = MONITOR_CHECK_CONFIG[type];
            expect(flag).toBeGreaterThan(0);
            expect(apiKey).toMatch(/^Skip/);
        }
    });
});
