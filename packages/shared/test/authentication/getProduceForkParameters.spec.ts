import { getProduceForkParameters } from '../../lib/authentication/fork/produce';

const getRedirectUrl = (value?: string) => {
    const searchParams = new URLSearchParams();
    if (value !== undefined) {
        searchParams.set('redirectUrl', value);
    }
    return getProduceForkParameters(searchParams).redirectUrl;
};

describe('getProduceForkParameters', () => {
    describe('redirectUrl', () => {
        [
            { name: 'should parse an https url', value: 'https://mail.proton.me/callback' },
            { name: 'should parse a localhost url with a port', value: 'http://localhost:8080/login' },
            { name: 'should parse a proton protocol url', value: 'proton-mail://' },
        ].forEach(({ name, value }) => {
            it(name, () => {
                expect(getRedirectUrl(value)?.href).toBe(new URL(value).href);
            });
        });

        [
            { name: 'should be null when absent', value: undefined },
            { name: 'should be null when empty', value: '' },
            { name: 'should be null for a non-parseable value', value: 'not a url' },
            { name: 'should be null for a path-relative value', value: '/\\\\evil.com' },
            { name: 'should be null for a protocol-relative value', value: '//evil.com' },
        ].forEach(({ name, value }) => {
            it(name, () => {
                expect(getRedirectUrl(value)).toBe(null);
            });
        });
    });
});
