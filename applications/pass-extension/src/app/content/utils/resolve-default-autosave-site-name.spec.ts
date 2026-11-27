import { parseUrl } from '@proton/pass/lib/urls/utils/parser';
import { PassFeature } from '@proton/pass/types/api/features';

import { resolveDefaultAutosaveSiteNameForPage } from './resolve-default-autosave-site-name';

describe('resolveDefaultAutosaveSiteNameForPage', () => {
    const appendMeta = (attributes: Record<string, string>) => {
        const meta = document.createElement('meta');
        Object.entries(attributes).forEach(([name, value]) => meta.setAttribute(name, value));
        document.head.appendChild(meta);
    };

    afterEach(() => {
        document.head.querySelectorAll('meta').forEach((meta) => meta.remove());
    });

    test('returns null when PassAutosaveSiteName is disabled', () => {
        const ctx = {
            getFeatureFlags: () => ({}),
            getExtensionContext: () => ({ frameUrl: parseUrl('https://login.example.com/') }),
        };

        expect(resolveDefaultAutosaveSiteNameForPage(ctx as any, document)).toBeNull();
    });

    test('resolves meta site name when the flag is on', () => {
        appendMeta({ property: 'og:site_name', content: 'Netflix' });

        const ctx = {
            getFeatureFlags: () => ({ [PassFeature.PassAutosaveSiteName]: true }),
            getExtensionContext: () => ({ frameUrl: parseUrl('https://www.netflix.com/') }),
        };

        expect(resolveDefaultAutosaveSiteNameForPage(ctx as any, document)).toBe('Netflix');
    });
});
