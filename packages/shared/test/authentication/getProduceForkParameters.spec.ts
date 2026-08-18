import { getProduceForkParameters } from '../../lib/authentication/fork/produce';

const getRedirectUrl = (value?: string) => {
    const searchParams = new URLSearchParams();
    if (value !== undefined) {
        searchParams.set('redirectUrl', value);
    }
    return getProduceForkParameters(searchParams).redirectUrl;
};

const getForkChallenge = (value?: string) => {
    const searchParams = new URLSearchParams();
    if (value !== undefined) {
        searchParams.set('forkChallenge', value);
    }
    return getProduceForkParameters(searchParams).forkChallenge;
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

    describe('forkChallenge', () => {
        it('should parse the value', () => {
            expect(getForkChallenge('a-challenge-value')).toBe('a-challenge-value');
        });

        it('should keep the value as-is without any validation', () => {
            expect(getForkChallenge(' <not a challenge> ')).toBe(' <not a challenge> ');
        });

        it('should be decoded from its url-encoded form', () => {
            const searchParams = new URLSearchParams('?forkChallenge=a%2Bchallenge%3D%3D');
            expect(getProduceForkParameters(searchParams).forkChallenge).toBe('a+challenge==');
        });

        it('should take the first value when repeated', () => {
            const searchParams = new URLSearchParams('?forkChallenge=first&forkChallenge=second');
            expect(getProduceForkParameters(searchParams).forkChallenge).toBe('first');
        });

        it('should be undefined when absent', () => {
            expect(getForkChallenge()).toBe(undefined);
        });

        it('should be undefined when empty', () => {
            expect(getForkChallenge('')).toBe(undefined);
        });
    });
});
