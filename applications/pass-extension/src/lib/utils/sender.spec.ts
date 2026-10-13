import type { Runtime } from 'webextension-polyfill';

import { parseUrl } from '@proton/pass/lib/urls/utils/parser';

import { isSupportedSenderUrl, parseSender } from './sender';

describe('`isSupportedSenderUrl`', () => {
    test.each([
        ['http://example.com', true],
        ['https://example.com:443', true],
        ['https://subdomain.example.com', true],
        ['https://', false],
        ['invalid url', false],
    ])('"%s" returns %s', (url, expected) => expect(isSupportedSenderUrl(parseUrl(url))).toBe(expected));
});

describe('`parseSender`', () => {
    const getSender = (origin: string, url?: string) =>
        Object.assign({ tab: { id: 1, url }, frameId: 0, url } as Runtime.MessageSender, { origin });

    test.each([
        ['same-origin url', 'https://example.com/form/login?step=2', 'https://example.com/form/login?step=2'],
        ['cross-origin url', 'https://evil.com/form/login', 'https://example.com'],
        ['missing url', undefined, 'https://example.com'],
        ['invalid url', 'not a url', 'https://example.com'],
    ])('keeps the verified origin on %s', async (_, url, expected) => {
        const { href, url: parsedUrl } = await parseSender(getSender('https://example.com', url));
        expect(href).toBe(expected);
        expect(parsedUrl.url).toBe(expected);
        expect(parsedUrl.domain).toBe('example.com');
    });
});
