// Also run by inbox-desktop's jest (applications/inbox-desktop/jest.config.ts `roots`).
// Keep runner-agnostic: no `vi.*` or imports from 'vitest'.
import { urlRule } from '../../lib/desktop/urls/builder';
import { matchUrlRules } from '../../lib/desktop/urls/matcher';
import { URL_RULES } from '../../lib/desktop/urls/rules';

const match = (url: string): boolean => matchUrlRules(url, URL_RULES);

describe('desktop url rules', () => {
    it('URL rules can be built', () => {
        URL_RULES.forEach((rule) => {
            expect(rule.regex).toBeInstanceOf(RegExp);
        });
    });
    it('invalid pattern throws', () => {
        expect(() => urlRule('test').build('not-a-flag')).toThrow();
        expect(() => urlRule('test').build('*')).toThrow();
    });
    describe('calendar bookings', () => {
        it.each([
            'https://calendar.proton.me/bookings',
            'https://calendar.proton.me/bookings#some-booking-id',
            'https://calendar.proton.me/bookings/guests#some-booking-id',
            'https://calendar.proton.me/u/0/bookings',
            'https://calendar.proton.me/u/1/bookings/',
            'https://calendar.proton.me/u/1/bookings#some-booking-id',
        ])('opens booking URL %s externally', (url) => {
            expect(match(url)).toBeTruthy();
        });

        it.each([
            'https://mail.proton.me/bookings',
            'https://account.proton.me/bookings',
            'https://calendar.proton.me/settings',
            'https://calendar.proton.me/u/0/',
            'https://calendar.proton.me/u/0/week/2025/11/26',
        ])('keeps non-booking URL %s in-app', (url) => {
            expect(match(url)).toBeFalsy();
        });
    });

    describe('account exceptions', () => {
        it('opens born-private externally', () => {
            expect(match('https://account.proton.me/born-private')).toBeTruthy();
            expect(match('https://account.proton.me/born-private/')).toBeTruthy();
        });

        it('keeps born-private on other apps in-app', () => {
            expect(match('https://mail.proton.me/born-private')).toBeFalsy();
            expect(match('https://calendar.proton.me/born-private/')).toBeFalsy();
        });

        it('opens the lite app externally', () => {
            expect(match('https://account.proton.me/lite')).toBeTruthy();
            expect(match('https://account.proton.me/u/0/lite#/upgrade')).toBeTruthy();
        });

        it('opens upsell signup with billing params externally', () => {
            expect(match('https://account.proton.me/signup?plan=mail2022')).toBeTruthy();
            expect(match('https://account.proton.me/signup?currency=EUR')).toBeTruthy();
        });

        it('opens close-ticket externally', () => {
            expect(match('https://account.proton.me/close-ticket')).toBeTruthy();
            expect(match('https://account.proton.me/close-ticket/')).toBeTruthy();
            expect(match('https://account.proton.me/Close-Ticket')).toBeTruthy();
        });

        it('keeps non close-ticket URLs in-app', () => {
            expect(match('https://mail.proton.me/close-ticket')).toBeFalsy();
            expect(match('https://calendar.proton.me/close-ticket')).toBeFalsy();
            expect(match('https://account.proton.me/settings')).toBeFalsy();
            expect(match('https://account.proton.me/close-ticket/extra')).toBeFalsy();
        });

        it('opens account-join-org-invite', () => {
            expect(match('https://account.proton.me/join-org')).toBeFalsy();
            expect(match('https://account.proton.me/join-org?org_id=123123')).toBeFalsy();

            expect(match('https://account.proton.me/join-org#dD0xMjIyMw')).toBeTruthy();

            const hashWithSpecialChars = 'dD1zb21ldG9rZW6-7_8';
            expect(hashWithSpecialChars).toContain('-');
            expect(hashWithSpecialChars).toContain('_');
            expect(match(`https://account.proton.me/join-org#${hashWithSpecialChars}`)).toBeTruthy();
        });

        it('opens account-update-daily-email-preferences', () => {
            expect(match('https://account.proton.me/unsubscribe/64#123123123123')).toBeTruthy();
            expect(match('https://account.proton.me/unsubscribe')).toBeTruthy();
            expect(match('https://account.proton.me/unsubscribe/query=random&second=thing')).toBeTruthy();
        });
    });

    describe('fallbacks', () => {
        it('returns null for unknown external URLs', () => {
            expect(match('https://example.com')).toBeFalsy();
            expect(match('https://example.com/close-ticket')).toBeFalsy();
        });

        it('returns null for malformed URLs', () => {
            expect(match('invalid url')).toBeFalsy();
            expect(match('not a url at all')).toBeFalsy();
        });
    });
});
