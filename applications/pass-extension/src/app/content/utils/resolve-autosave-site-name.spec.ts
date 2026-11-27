import { resolveAutosaveSiteName } from './resolve-autosave-site-name';

const clearDocumentMeta = () => {
    document.head.querySelectorAll('meta').forEach((meta) => meta.remove());
    document.title = '';
};

const appendMeta = (attributes: Record<string, string>) => {
    const meta = document.createElement('meta');
    Object.entries(attributes).forEach(([name, value]) => meta.setAttribute(name, value));
    document.head.appendChild(meta);
};

describe('resolveAutosaveSiteName', () => {
    afterEach(() => {
        clearDocumentMeta();
    });

    test('prefers og:site_name over page title and domain', () => {
        appendMeta({ property: 'og:site_name', content: 'Netflix' });
        document.title = 'Some article headline';

        expect(resolveAutosaveSiteName(document, 'https://www.netflix.com/watch/123')).toBe('Netflix');
    });

    test('uses application-name when og:site_name is missing', () => {
        appendMeta({ name: 'application-name', content: 'Proton Mail' });

        expect(resolveAutosaveSiteName(document, 'https://mail.proton.me/login')).toBe('Proton Mail');
    });

    test('strips invisible and bidi control characters from meta content', () => {
        appendMeta({ property: 'og:site_name', content: 'Net\u200Bflix' });

        expect(resolveAutosaveSiteName(document, 'https://www.netflix.com/')).toBe('Netflix');
    });

    test('falls back when meta content is only invisible characters', () => {
        appendMeta({ property: 'og:site_name', content: '\u200B\uFEFF' });

        expect(resolveAutosaveSiteName(document, 'https://login.example.com/')).toBe('Example');
    });

    test('does not return an empty name when metadata is missing', () => {
        expect(resolveAutosaveSiteName(document, 'https://login.example.com/')).toBe('Example');
    });

    test('returns null when the URL cannot be parsed', () => {
        expect(resolveAutosaveSiteName(document, 'about:blank')).toBeNull();
    });
});
