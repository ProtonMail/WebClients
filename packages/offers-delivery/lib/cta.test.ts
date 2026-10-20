import { CYCLE, PLANS } from '@proton/shared/lib/payments/constants';

import { CampaignCtaType } from '../interface';
import type { RawGoToUpsell } from './api';
import { resolveCta, toPublicCta } from './cta';

const externalCta = (url: string) => ({
    Type: CampaignCtaType.EXTERNAL_GO_TO,
    InternalGoTo: null,
    ExternalGoTo: { Url: url },
});

const internalCta = (destination: string, goToUpsell: RawGoToUpsell | null = null) => ({
    Type: CampaignCtaType.INTERNAL_GO_TO,
    InternalGoTo: { Destination: destination, GoToUpsell: goToUpsell },
    ExternalGoTo: null,
});

const goToUpsell = (overrides: Partial<RawGoToUpsell> = {}): RawGoToUpsell => ({
    Plan: PLANS.MAIL,
    Coupon: null,
    Cycle: null,
    DisableCycleSelector: false,
    DisablePlanSelector: false,
    ...overrides,
});

describe('resolveCta', () => {
    it('matches the gateway ExternalGoTo type value', () => {
        expect(CampaignCtaType.EXTERNAL_GO_TO).toBe('ExternalGoTo');
    });

    it('resolves an external https url to its exact sanitized href', () => {
        expect(resolveCta(externalCta('https://proton.me/promo'))).toEqual({
            kind: 'external',
            href: 'https://proton.me/promo',
        });
    });

    it('rejects a hostile javascript: url for an external cta', () => {
        expect(resolveCta(externalCta('javascript:alert(1)'))).toBeNull();
    });

    it('rejects a hostile http: url for an external cta', () => {
        expect(resolveCta(externalCta('http://evil.com/promo'))).toBeNull();
    });

    it('rejects an external cta whose ExternalGoTo branch is missing', () => {
        expect(resolveCta({ Type: CampaignCtaType.EXTERNAL_GO_TO, InternalGoTo: null, ExternalGoTo: null })).toBeNull();
    });

    it('resolves the GoToUpsell destination without params to the upgrade kind', () => {
        expect(resolveCta(internalCta('GoToUpsell'))).toEqual({ kind: 'upgrade', params: null });
    });

    it('maps the GoToUpsell params the gateway sends', () => {
        const params = goToUpsell({
            Plan: PLANS.MAIL,
            Coupon: 'SUMMER',
            Cycle: CYCLE.YEARLY,
            DisableCycleSelector: true,
            DisablePlanSelector: true,
        });

        expect(resolveCta(internalCta('GoToUpsell', params))).toEqual({
            kind: 'upgrade',
            params: {
                plan: PLANS.MAIL,
                coupon: 'SUMMER',
                cycle: CYCLE.YEARLY,
                disableCycleSelector: true,
                disablePlanSelector: true,
            },
        });
    });

    it('maps null upsell fields to their unset values', () => {
        expect(resolveCta(internalCta('GoToUpsell', goToUpsell({ Plan: null })))).toEqual({
            kind: 'upgrade',
            params: {
                plan: undefined,
                coupon: null,
                cycle: undefined,
                disableCycleSelector: false,
                disablePlanSelector: false,
            },
        });
    });

    it('drops an unknown plan, an invalid cycle and non-boolean flags', () => {
        const hostile = {
            ...goToUpsell(),
            Plan: 'not-a-plan',
            Cycle: 7,
            DisableCycleSelector: 'true',
            DisablePlanSelector: 1,
        } as unknown as RawGoToUpsell;

        expect(resolveCta(internalCta('GoToUpsell', hostile))).toEqual({
            kind: 'upgrade',
            params: {
                plan: undefined,
                coupon: null,
                cycle: undefined,
                disableCycleSelector: false,
                disablePlanSelector: false,
            },
        });
    });

    it('rejects an internal cta whose InternalGoTo branch is missing', () => {
        expect(resolveCta({ Type: CampaignCtaType.INTERNAL_GO_TO, InternalGoTo: null, ExternalGoTo: null })).toBeNull();
    });

    it.each([
        ['an app path', '/settings/subscription'],
        ['the root path', '/'],
        ['a protocol-relative destination', '//evil.com'],
        ['an absolute url', 'https://evil.com'],
        ['an unknown destination', 'GoToSomethingElse'],
    ] as const)('rejects %s for an internal cta', (_label, destination) => {
        expect(resolveCta(internalCta(destination))).toBeNull();
    });

    it('rejects an unknown cta type', () => {
        const unknownType = { ...internalCta('GoToUpsell'), Type: 'Teleport' as CampaignCtaType };

        expect(resolveCta(unknownType)).toBeNull();
    });
});

describe('toPublicCta', () => {
    it('returns null when ctaText is blank, even for an otherwise valid cta', () => {
        expect(toPublicCta({ kind: 'upgrade', params: null }, '   ')).toBeNull();
        expect(toPublicCta({ kind: 'upgrade', params: null }, '')).toBeNull();
    });

    it('returns null when the resolved cta is null', () => {
        expect(toPublicCta(null, 'Upgrade now')).toBeNull();
    });

    it('carries the href for an external cta', () => {
        const result = toPublicCta({ kind: 'external', href: 'https://proton.me/promo' }, 'Learn more');

        expect(result).toEqual({ text: 'Learn more', kind: 'external', href: 'https://proton.me/promo' });
    });

    it('produces an internal cta with no href property for an upgrade cta', () => {
        const result = toPublicCta({ kind: 'upgrade', params: null }, 'Upgrade now');

        expect(result).toEqual({ text: 'Upgrade now', kind: 'internal' });
        expect(result && Object.prototype.hasOwnProperty.call(result, 'href')).toBe(false);
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
        ['a number', 42],
        ['an object', {}],
    ] as const)('returns null rather than throwing when ctaText is %s', (_label, ctaText) => {
        expect(toPublicCta({ kind: 'upgrade', params: null }, ctaText as unknown as string)).toBeNull();
    });
});
