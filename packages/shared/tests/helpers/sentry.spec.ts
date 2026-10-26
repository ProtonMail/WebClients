import type { ErrorEvent, EventHint } from '@sentry/types/types/event';

import { VPN_HOSTNAME } from '../../lib/constants';
import type { ProtonConfig } from '../../lib/interfaces/config';

vi.mock('@sentry/browser', () => ({
    Integrations: { Breadcrumbs: vi.fn() },
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
    configureScope: vi.fn((cb: any) => cb({ setTag: vi.fn() })),
    init: vi.fn(),
    makeFetchTransport: vi.fn(),
    captureMessage: vi.fn(),
    startInactiveSpan: vi.fn(),
}));

const { isProduction, redactSensitiveString, default: initSentry } = await import('../../lib/helpers/sentry');
const { init } = await import('@sentry/browser');

describe('isProduction', () => {
    it('should recognize production subdomains', () => {
        expect(isProduction('account.proton.me')).toEqual(true);
        expect(isProduction('mail.proton.me')).toEqual(true);
        expect(isProduction('drive.proton.me')).toEqual(true);
        expect(isProduction('pass.proton.me')).toEqual(true);
        expect(isProduction('wallet.proton.me')).toEqual(true);
        expect(isProduction(VPN_HOSTNAME)).toEqual(true);
        expect(isProduction('account.protonvpn.com')).toEqual(true);
        expect(isProduction('join.protonvpn.com')).toEqual(true);
    });
});

describe('sentry beforeSend', () => {
    const getBeforeSend = () => {
        initSentry({
            config: { SENTRY_DSN: 'https://key@sentry/1' } as ProtonConfig,
            sentryConfig: { host: 'drive.proton.me', release: '1.0.0', environment: 'proton.me' },
            setupIgnore: () => false,
        });
        const options = vi.mocked(init).mock.calls.at(-1)?.[0];
        if (!options?.beforeSend) {
            throw new Error('beforeSend was not registered');
        }
        return (event: ErrorEvent, hint: EventHint = {}) => options.beforeSend!(event, hint) as ErrorEvent | null;
    };

    it('redacts a literal hash in the request URL', () => {
        const beforeSend = getBeforeSend();
        const event = { request: { url: 'https://drive.proton.me/urls/TBYS1295RG#secretpass' } } as ErrorEvent;
        expect(beforeSend(event)?.request?.url).toEqual('https://drive.proton.me/urls/TBYS1295RG#[Filtered]');
    });

    it('redacts a URL-encoded hash (%23) in the request URL', () => {
        const beforeSend = getBeforeSend();
        const event = { request: { url: 'https://drive.proton.me/urls/TBYS1295RG%23secretpass' } } as ErrorEvent;
        expect(beforeSend(event)?.request?.url).toEqual('https://drive.proton.me/urls/TBYS1295RG#[Filtered]');
    });

    it('redacts a hash in the event message', () => {
        const beforeSend = getBeforeSend();
        const event = { message: 'Failed to load https://drive.proton.me/urls/TBYS1295RG#secretpass' } as ErrorEvent;
        expect(beforeSend(event)?.message).toEqual('Failed to load https://drive.proton.me/urls/TBYS1295RG#[Filtered]');
    });

    it('redacts personal data in the request URL, headers, message, contexts and tags', () => {
        const beforeSend = getBeforeSend();
        const event = {
            message: 'Lookup failed for jane@proton.me',
            request: {
                url: 'https://account.proton.me/reset?Username=jane#token',
                headers: { Referer: 'https://account.proton.me/u/0#secret' },
            },
            contexts: { lookup: { email: 'jane@proton.me' } },
            tags: { address: 'jane@proton.me' },
        } as unknown as ErrorEvent;

        expect(beforeSend(event)).toMatchObject({
            message: 'Lookup failed for [Filtered]',
            request: {
                url: 'https://account.proton.me/reset?Username=[Filtered]#[Filtered]',
                headers: { Referer: 'https://account.proton.me/u/0#[Filtered]' },
            },
            contexts: { lookup: { email: '[Filtered]' } },
            tags: { address: '[Filtered]' },
        });
    });

    it('redacts a URL-encoded hash in navigation breadcrumbs', () => {
        const beforeSend = getBeforeSend();
        const event = {
            breadcrumbs: [
                {
                    category: 'navigation',
                    data: {
                        from: 'https://drive.proton.me/urls/AAA%23secretpass',
                        to: 'https://drive.proton.me/urls/BBB%23secretpass',
                    },
                },
            ],
        } as unknown as ErrorEvent;
        const result = beforeSend(event);
        expect(result?.breadcrumbs?.[0].data?.from).toEqual('https://drive.proton.me/urls/AAA#[Filtered]');
        expect(result?.breadcrumbs?.[0].data?.to).toEqual('https://drive.proton.me/urls/BBB#[Filtered]');
    });

    it('redacts query params from navigation breadcrumbs', () => {
        const beforeSend = getBeforeSend();
        const event = {
            breadcrumbs: [
                {
                    category: 'navigation',
                    data: {
                        from: '/doc?mode=open&linkId=abc&email=someone%40protonmail.com',
                        to: '/u/1/doc?mode=open&linkId=abc&email=someone%40protonmail.com',
                    },
                },
            ],
        } as unknown as ErrorEvent;
        const result = beforeSend(event);
        expect(result?.breadcrumbs?.[0].data?.from).toEqual('/doc?mode=[Filtered]&linkId=[Filtered]&email=[Filtered]');
        expect(result?.breadcrumbs?.[0].data?.to).toEqual(
            '/u/1/doc?mode=[Filtered]&linkId=[Filtered]&email=[Filtered]'
        );
    });

    it('redacts query params in fetch breadcrumbs, including the underlying data.url', () => {
        const beforeSend = getBeforeSend();
        const event = {
            breadcrumbs: [
                {
                    category: 'fetch',
                    data: {
                        url: 'https://drive.proton.me/api/core/v4/keys/all?Email=someone%40proton.me&InternalOnly=1',
                    },
                },
            ],
        } as unknown as ErrorEvent;
        const result = beforeSend(event);
        expect(result?.breadcrumbs?.[0].data?.url).toEqual(
            'https://drive.proton.me/api/core/v4/keys/all?Email=[Filtered]&InternalOnly=[Filtered]'
        );
        expect(result?.breadcrumbs?.[0].message).toEqual(
            'https://drive.proton.me/api/core/v4/keys/all?Email=[Filtered]&InternalOnly=[Filtered]'
        );
    });

    it('redacts a URL-encoded password from exception messages', () => {
        const beforeSend = getBeforeSend();
        const event = {
            exception: {
                values: [{ value: 'Error fetching https://drive.proton.me/urls/TBYS1295RG%23secretpasswd' }],
            },
        } as unknown as ErrorEvent;
        expect(beforeSend(event)?.exception?.values?.[0].value).toEqual(
            'Error fetching https://drive.proton.me/urls/TBYS1295RG#[Filtered]'
        );
    });

    it('redacts anything after a literal hash in exception messages, regardless of content or path', () => {
        const beforeSend = getBeforeSend();
        const event = {
            exception: {
                values: [{ value: 'Error at https://drive.proton.me/some/other/path#anything-at-all' }],
            },
        } as unknown as ErrorEvent;
        expect(beforeSend(event)?.exception?.values?.[0].value).toEqual(
            'Error at https://drive.proton.me/some/other/path#[Filtered]'
        );
    });
});

describe('redactSensitiveString()', () => {
    it('redacts anything after a hash', () => {
        expect(redactSensitiveString('https://drive.proton.me/urls/TBYS1295RG#s3cr3t-p4ssw0rd')).toBe(
            'https://drive.proton.me/urls/TBYS1295RG#[Filtered]'
        );
    });

    it('redacts anything after an encoded hash', () => {
        expect(redactSensitiveString('GET https://drive.proton.me/urls/TBYS1295RG%23s3cr3t')).toBe(
            'GET https://drive.proton.me/urls/TBYS1295RG#[Filtered]'
        );
    });

    it('redacts email query parameters', () => {
        expect(redactSensitiveString('https://account.proton.me/api/keys/all?email=someone@example.com&Page=0')).toBe(
            'https://account.proton.me/api/keys/all?email=[Filtered]&Page=0'
        );
    });

    it('redacts every query parameter value and keeps the key casing', () => {
        expect(redactSensitiveString('/api/core/v4/users/available?Name=jane&Username=x&Email=c@d.com')).toBe(
            '/api/core/v4/users/available?Name=[Filtered]&Username=[Filtered]&Email=[Filtered]'
        );
    });

    it('keeps the values of allowlisted query parameters', () => {
        expect(redactSensitiveString('?Page=2&PageSize=50&Name=jane&ParseDomain=1')).toBe(
            '?Page=2&PageSize=50&Name=[Filtered]&ParseDomain=1'
        );
    });

    it('keeps the checkout query parameters', () => {
        expect(redactSensitiveString('?plan=mail2022&cycle=12&currency=EUR&coupon=BLACK&lastName=Doe')).toBe(
            '?plan=mail2022&cycle=12&currency=EUR&coupon=BLACK&lastName=[Filtered]'
        );
    });

    it('redacts a query parameter value that contains spaces', () => {
        expect(redactSensitiveString('?Name=Jane Doe&Page=1')).toBe('?Name=[Filtered]&Page=1');
    });

    it('stops redacting a query parameter value at the end of the line', () => {
        expect(redactSensitiveString('Fetching /api/core/v4/foo?Bar=1 failed\n    at load (index.js:1:2)')).toBe(
            'Fetching /api/core/v4/foo?Bar=[Filtered]\n    at load (index.js:1:2)'
        );
    });

    it('leaves optional chaining in error text alone', () => {
        expect(redactSensitiveString('Error: a?.b=1')).toBe('Error: a?.b=1');
    });

    it('redacts query parameters with a malformed encoded key', () => {
        expect(redactSensitiveString('?%E0%A4%A=jane')).toBe('?%E0%A4%A=[Filtered]');
    });

    it('redacts the username and token of a reset link', () => {
        expect(redactSensitiveString('/api/core/v4/reset/jane.doe/123456?x=1')).toBe(
            '/api/core/v4/reset/[Filtered]/[Filtered]?x=[Filtered]'
        );
    });

    it('redacts the token and code of a verification link', () => {
        expect(redactSensitiveString('/api/core/v4/verification/email/abcToken/123456')).toBe(
            '/api/core/v4/verification/email/[Filtered]'
        );
    });

    it('keeps the separators between email addresses', () => {
        expect(redactSensitiveString('a@b.com,c@d.com')).toBe('[Filtered],[Filtered]');
    });

    it.each(['A', '=a%40', 'a%40'])('redacts long repetitions of %s without backtracking', (unit) => {
        const value = unit.repeat(40_000);
        const start = performance.now();

        redactSensitiveString(value);

        expect(performance.now() - start).toBeLessThan(500);
    });

    it('leaves the username recovery endpoint alone', () => {
        expect(redactSensitiveString('/api/core/v4/reset/username')).toBe('/api/core/v4/reset/username');
    });

    it('redacts email addresses in the path', () => {
        expect(redactSensitiveString('/api/calendar/v1/jane@proton.me/busy-schedule?Start=1')).toBe(
            '/api/calendar/v1/[Filtered]/busy-schedule?Start=1'
        );
    });

    it('redacts encoded email addresses', () => {
        expect(redactSensitiveString('/api/calendar/v1/jane%40proton.me/busy-schedule')).toBe(
            '/api/calendar/v1/[Filtered]/busy-schedule'
        );
    });

    it('redacts email addresses in array query parameters', () => {
        expect(redactSensitiveString('/api/core/v4/addresses/canonical?Emails[]=a@b.com&Emails[]=c@d.ch')).toBe(
            '/api/core/v4/addresses/canonical?Emails[]=[Filtered]&Emails[]=[Filtered]'
        );
    });

    it('leaves package versions, scoped packages and Safari stack frames alone', () => {
        const value = 'node_modules/@sentry/browser@8.0.0 render@https://account.proton.me/assets/index.js:1:2';

        expect(redactSensitiveString(value, { redactFragment: false })).toBe(value);
    });

    it('stops an email query parameter at the hash', () => {
        expect(redactSensitiveString('div?email=a#root', { redactFragment: false })).toBe('div?email=[Filtered]#root');
    });

    it('leaves strings without anything sensitive alone', () => {
        expect(redactSensitiveString('GET https://drive.proton.me/api/drive/volumes')).toBe(
            'GET https://drive.proton.me/api/drive/volumes'
        );
    });

    it('leaves exception messages alone', () => {
        const value = "TypeError: Cannot read properties of undefined (reading 'foo')";

        expect(redactSensitiveString(value)).toBe(value);
    });

    it('can keep a hash, for DOM selectors', () => {
        expect(redactSensitiveString('div#root > button.toolbar-button', { redactFragment: false })).toBe(
            'div#root > button.toolbar-button'
        );
    });
});
