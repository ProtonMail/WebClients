import { isEmailLink, parseEmailLink } from './emailLinks';

describe('isEmailLink', () => {
    it.each(['mailto:alice@example.com', ' MAILTO:alice@example.com '])('recognizes %s', (url) => {
        expect(isEmailLink(url)).toBe(true);
    });

    it.each(['https://example.com', 'alice@example.com', 'javascript:mailto:alice@example.com'])(
        'does not recognize %s',
        (url) => expect(isEmailLink(url)).toBe(false)
    );
});

describe('parseEmailLink', () => {
    it('decodes all displayed fields and builds a matching canonical link', () => {
        const result = parseEmailLink(
            ' MAILTO:alice+tag%40example.com?TO=bob%40example.org&CC=carol+tag%40example.net&BCC=dave%40example.com&subject=Hello%20%26%20welcome&body=First%20line%0D%0ASecond%09line '
        );
        expect(result).toEqual({
            to: ['alice+tag@example.com', 'bob@example.org'],
            cc: ['carol+tag@example.net'],
            bcc: ['dave@example.com'],
            subject: 'Hello & welcome',
            body: 'First line\r\nSecond\tline',
            href: 'mailto:alice%2Btag%40example.com,bob%40example.org?cc=carol%2Btag%40example.net&bcc=dave%40example.com&subject=Hello%20%26%20welcome&body=First%20line%0D%0ASecond%09line',
        });
    });

    it('accepts a draft without recipients', () => {
        expect(parseEmailLink('mailto:?subject=Hello')).toEqual({
            to: [],
            cc: [],
            bcc: [],
            subject: 'Hello',
            body: '',
            href: 'mailto:?subject=Hello',
        });
    });

    it('preserves literal plus signs and decodes only once', () => {
        expect(parseEmailLink('mailto:alice@example.com?subject=A+B%2520C&body=%2526bcc%253Devil')).toMatchObject({
            subject: 'A+B%20C',
            body: '%26bcc%3Devil',
        });
    });

    it('keeps encoded delimiters in the message instead of treating them as headers', () => {
        expect(
            parseEmailLink('mailto:alice@example.com?body=Hello%26bcc%3Dbob%40example.org%23fragment')
        ).toMatchObject({
            bcc: [],
            body: 'Hello&bcc=bob@example.org#fragment',
        });
    });

    it('splits encoded recipient lists and trims encoded surrounding spaces', () => {
        expect(
            parseEmailLink(
                'mailto:alice%40example.com%2C%20bob%40example.org?cc=carol%40example.net%2Cdave%40example.com'
            )
        ).toMatchObject({
            to: ['alice@example.com', 'bob@example.org'],
            cc: ['carol@example.net', 'dave@example.com'],
        });
    });

    it.each([
        'https://example.com',
        'mailto:alice@example.com#fragment',
        'mailto:alice@example.com?subject=raw space',
        'mailto:alice@example.com\n?bcc=bob@example.org',
        'mailto:%ZZ@example.com',
        'mailto:alice@example.com?subject=%E0%A4',
        'mailto:alice@example.com?%ZZ=value',
        'mailto:alice@example.com?attach=file.txt',
        'mailto:alice@example.com?subject',
        'mailto:alice@example.com?subject=one&SUBJECT=two',
        'mailto:alice@example.com?bcc=bob@example.org&%62cc=carol@example.net',
        'mailto:alice@example.com?subject=Hello%0D%0ABcc%3Abob@example.org',
        'mailto:alice@example.com?cc=bob@example.org%0A',
        'mailto:alice%0D%0A@example.com',
        'mailto:alice@example.com?body=%00',
        'mailto:alice@example.com?body=%7F',
        'mailto:invalid',
        'mailto:alice@example.com,',
        'mailto:Alice%20%3Calice@example.com%3E',
        'mailto:ali%20ce@example.com',
        'mailto:ali%E2%80%AEce@example.com',
    ])('rejects unsafe or unsupported input: %s', (url) => {
        expect(parseEmailLink(url)).toBeNull();
    });

    it.each([
        'mailto:',
        'mailto:alice@example.com',
        'mailto:?to=alice@example.com&cc=bob@example.org&bcc=carol@example.net',
        'mailto:alice+tag@example.com?subject=Hello+world&body=%E4%BD%A0%E5%A5%BD%0A%26%3D%23',
    ])('preserves every displayed field when the rebuilt link is parsed: %s', (url) => {
        const result = parseEmailLink(url);
        expect(result).not.toBeNull();
        expect(parseEmailLink(result!.href)).toEqual(result);
    });
});
