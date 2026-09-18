import { CampaignCtaType } from '../interface';
import { type CtaHandlers, performCta, resolveCta, toPublicCta } from './cta';

describe('resolveCta', () => {
    it('matches the gateway ExternalGoTo type value', () => {
        expect(CampaignCtaType.EXTERNAL_GO_TO).toBe('ExternalGoTo');
    });

    it('resolves an external https ref to its exact sanitized href', () => {
        expect(resolveCta(CampaignCtaType.EXTERNAL_GO_TO, 'https://proton.me/promo')).toEqual({
            kind: 'external',
            href: 'https://proton.me/promo',
        });
    });

    it('rejects a hostile javascript: ref for an external cta', () => {
        expect(resolveCta(CampaignCtaType.EXTERNAL_GO_TO, 'javascript:alert(1)')).toBeNull();
    });

    it('rejects a hostile http: ref for an external cta', () => {
        expect(resolveCta(CampaignCtaType.EXTERNAL_GO_TO, 'http://evil.com/promo')).toBeNull();
    });

    it('resolves the GoToUpsell token to the upgrade kind', () => {
        expect(resolveCta(CampaignCtaType.INTERNAL_GO_TO, 'GoToUpsell')).toEqual({ kind: 'upgrade' });
    });

    it.each([
        ['an app path', '/settings/subscription'],
        ['the root path', '/'],
        ['a protocol-relative ref', '//evil.com'],
        ['an absolute url', 'https://evil.com'],
        ['an unknown token', 'GoToSomethingElse'],
    ] as const)('rejects %s for an internal cta', (_label, ref) => {
        expect(resolveCta(CampaignCtaType.INTERNAL_GO_TO, ref)).toBeNull();
    });
});

describe('toPublicCta', () => {
    it('returns null when ctaText is blank, even for an otherwise valid cta', () => {
        expect(toPublicCta({ kind: 'upgrade' }, '   ')).toBeNull();
        expect(toPublicCta({ kind: 'upgrade' }, '')).toBeNull();
    });

    it('returns null when the resolved cta is null', () => {
        expect(toPublicCta(null, 'Upgrade now')).toBeNull();
    });

    it('carries the href for an external cta', () => {
        const result = toPublicCta({ kind: 'external', href: 'https://proton.me/promo' }, 'Learn more');

        expect(result).toEqual({ text: 'Learn more', kind: 'external', href: 'https://proton.me/promo' });
    });

    it('produces an internal cta with no href property for an upgrade cta', () => {
        const result = toPublicCta({ kind: 'upgrade' }, 'Upgrade now');

        expect(result).toEqual({ text: 'Upgrade now', kind: 'internal' });
        expect(result && Object.prototype.hasOwnProperty.call(result, 'href')).toBe(false);
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
        ['a number', 42],
        ['an object', {}],
    ] as const)('returns null rather than throwing when ctaText is %s', (_label, ctaText) => {
        expect(toPublicCta({ kind: 'upgrade' }, ctaText as unknown as string)).toBeNull();
    });
});

describe('performCta', () => {
    const buildHandlers = (): CtaHandlers & {
        onExternalLink: jest.Mock;
        onUpgrade: jest.Mock;
    } => ({
        onExternalLink: jest.fn(),
        onUpgrade: jest.fn(),
    });

    it('dispatches an external cta to onExternalLink with the exact href', () => {
        const handlers = buildHandlers();

        performCta({ kind: 'external', href: 'https://proton.me/promo' }, handlers);

        expect(handlers.onExternalLink).toHaveBeenCalledWith('https://proton.me/promo');
        expect(handlers.onUpgrade).not.toHaveBeenCalled();
    });

    it('dispatches an upgrade cta to onUpgrade with a null coupon', () => {
        const handlers = buildHandlers();

        performCta({ kind: 'upgrade' }, handlers);

        expect(handlers.onUpgrade).toHaveBeenCalledWith(null);
        expect(handlers.onExternalLink).not.toHaveBeenCalled();
    });

    it('does not throw when onUpgrade is not provided for an upgrade cta', () => {
        const handlers = buildHandlers();
        delete (handlers as Partial<CtaHandlers>).onUpgrade;

        expect(() => performCta({ kind: 'upgrade' }, handlers)).not.toThrow();
    });
});
