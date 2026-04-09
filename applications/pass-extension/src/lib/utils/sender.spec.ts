import { parseUrl } from '@proton/pass/utils/url/parser';

import { isSupportedSenderUrl } from './sender';

describe('`isSupportedSenderUrl`', () => {
    test.each([
        ['http://example.com', true],
        ['https://example.com:443', true],
        ['https://subdomain.example.com', true],
        ['https://', false],
        ['invalid url', false],
    ])('"%s" returns %s', (url, expected) => expect(isSupportedSenderUrl(parseUrl(url))).toBe(expected));
});
