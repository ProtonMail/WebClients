import { SSO_PATHS } from '@proton/shared/lib/constants';

import { getJoiningLinkHref, parseJoiningLinkConfig } from './helpers';

jest.mock('@protontech/crypto', () => ({}));

describe('getJoiningLinkHref', () => {
    it('produces valid URL', () => {
        const href = getJoiningLinkHref({
            token: 'mytoken',
            password: 'mypassword',
            organizationName: undefined,
            domainName: undefined,
        });

        const url = new URL(href);

        expect(url.pathname).toBe(SSO_PATHS.JOIN_ORG);
        expect(url.hash).not.toBe('');
    });
});

describe('parseJoiningLinkConfig', () => {
    it('decodes a hash produced by getJoiningLinkHref', () => {
        const href = getJoiningLinkHref({
            token: 'mytoken',
            password: 'mypassword',
            organizationName: 'MyOrg',
            domainName: 'myorg.com',
        });
        const hash = new URL(href).hash;
        const parsed = parseJoiningLinkConfig({ hash });

        expect(parsed).toMatchObject({
            token: 'mytoken',
            password: 'mypassword',
            orgName: 'MyOrg',
            domain: 'myorg.com',
        });
    });

    it('does not throw and returns undefined for invalid input', () => {
        expect(() => parseJoiningLinkConfig({ hash: '' })).not.toThrow();
        expect(parseJoiningLinkConfig({ hash: '' })).toBeUndefined();

        expect(() => parseJoiningLinkConfig({ hash: '#!!!not-valid-base64' })).not.toThrow();
        expect(parseJoiningLinkConfig({ hash: '#!!!not-valid-base64' })).toBeUndefined();
    });

    it('does not throw and returns undefined when required args not included', () => {
        const noToken = new URL(
            getJoiningLinkHref({
                token: '',
                password: 'mypassword',
                organizationName: undefined,
                domainName: undefined,
            })
        ).hash;

        const noPassword = new URL(
            getJoiningLinkHref({
                token: 'tok',
                password: '',
                organizationName: undefined,
                domainName: undefined,
            })
        ).hash;

        expect(() => parseJoiningLinkConfig({ hash: noToken })).not.toThrow();
        expect(parseJoiningLinkConfig({ hash: noToken })).toBeUndefined();

        expect(() => parseJoiningLinkConfig({ hash: noPassword })).not.toThrow();
        expect(parseJoiningLinkConfig({ hash: noPassword })).toBeUndefined();
    });

    it('works with only password and token, treating everything else as optional', () => {
        const href = getJoiningLinkHref({
            token: 'tok',
            password: 'pass',
            organizationName: undefined,
            domainName: undefined,
        });
        const hash = href.slice(href.indexOf('#'));
        const parsed = parseJoiningLinkConfig({ hash });

        expect(parsed?.password).toBe('pass');
        expect(parsed?.token).toBe('tok');
        expect(parsed?.orgName).toBe('');
        expect(parsed?.domain).toBe('');
    });
});
