import { DOMAIN_STATE } from '@proton/shared/lib/interfaces/Domain';

import { getServiceAccountDomain, getServiceAccountEmail, getServiceAccountEmailLocal } from './helpers';

describe('getServiceAccountEmailLocal', () => {
    it('turns a name into a valid local part', () => {
        expect(getServiceAccountEmailLocal(' CI Bot (prod) ')).toBe('ci-bot-prod');
        expect(getServiceAccountEmailLocal('Café_sync.v2')).toBe('cafe_sync.v2');
    });

    it('collapses consecutive separators, which make an invalid address', () => {
        expect(getServiceAccountEmailLocal('ci..bot')).toBe('ci.bot');
        expect(getServiceAccountEmailLocal('ci-. bot')).toBe('ci.bot');
        expect(getServiceAccountEmailLocal('ci__bot')).toBe('ci_bot');
    });

    it('keeps local parts within the username limit and handles names without Latin characters', () => {
        expect(getServiceAccountEmailLocal(`${'a'.repeat(39)}.another-part`)).toBe('a'.repeat(39));
        expect(getServiceAccountEmailLocal('🤖')).toBe('service-account');
    });
});

describe('getServiceAccountEmail', () => {
    it('puts the local part on the domain, with a number after the name from 2', () => {
        expect(getServiceAccountEmail('CI Bot', 'example.test')).toBe('ci-bot@example.test');
        expect(getServiceAccountEmail('CI Bot', 'example.test', 1)).toBe('ci-bot@example.test');
        expect(getServiceAccountEmail('CI Bot', 'example.test', 2)).toBe('ci-bot2@example.test');
    });

    it('keeps numbered local parts within the username limit', () => {
        expect(getServiceAccountEmail(`${'a'.repeat(38)}-b`, 'example.test', 12)).toBe(
            `${'a'.repeat(38)}12@example.test`
        );
    });
});

describe('getServiceAccountDomain', () => {
    it('picks the first active domain', () => {
        const domains = [
            { DomainName: 'unverified.test', State: DOMAIN_STATE.DOMAIN_STATE_DEFAULT, Flags: { 'mail-intent': true } },
            { DomainName: 'example.test', State: DOMAIN_STATE.DOMAIN_STATE_VERIFIED, Flags: { 'mail-intent': true } },
            { DomainName: 'other.test', State: DOMAIN_STATE.DOMAIN_STATE_VERIFIED, Flags: { 'mail-intent': true } },
        ] as any[];
        expect(getServiceAccountDomain(domains)).toBe('example.test');
        expect(getServiceAccountDomain([])).toBeUndefined();
        expect(getServiceAccountDomain(undefined)).toBeUndefined();
    });
});
