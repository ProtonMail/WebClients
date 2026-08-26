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

const getChildClientID = (value?: string) => {
    const searchParams = new URLSearchParams();
    if (value !== undefined) {
        searchParams.set('clientId', value);
    }
    return getProduceForkParameters(searchParams).childClientID;
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

    describe('childClientID', () => {
        [
            { name: 'should parse a web client id', value: 'web-mail' },
            { name: 'should parse a multi part web client id', value: 'web-docs-editor' },
            { name: 'should parse a windows client id', value: 'windows-pass' },
            { name: 'should parse a macos client id', value: 'macos-mail' },
            { name: 'should parse a linux client id', value: 'linux-lumo' },
            { name: 'should parse an ios client id', value: 'ios-calendar' },
            { name: 'should parse an android client id', value: 'android-mail' },
            { name: 'should parse an apple tv client id', value: 'apple_tv-vpn' },
            { name: 'should parse an android tv client id', value: 'android_tv-vpn' },
            { name: 'should parse a vega tv client id', value: 'vega_tv-vpn' },
            { name: 'should parse a browser extension client id', value: 'browser-pass' },
        ].forEach(({ name, value }) => {
            it(name, () => {
                expect(getChildClientID(value)).toBe(value);
            });
        });

        [
            { name: 'should be undefined when absent', value: undefined },
            { name: 'should be undefined when empty', value: '' },
            { name: 'should be undefined for an unknown platform', value: 'evil-client' },
            { name: 'should be undefined without a platform', value: 'mail' },
            { name: 'should be undefined without an app', value: 'ios-' },
            { name: 'should be undefined for a differently cased platform', value: 'iOS-mail' },
            { name: 'should be undefined for a platform prefixed value', value: 'not-ios-mail' },
        ].forEach(({ name, value }) => {
            it(name, () => {
                expect(getChildClientID(value)).toBe(undefined);
            });
        });
    });
});
