import type { ErrorEvent, EventHint } from '@sentry/types/types/event';

import { VPN_HOSTNAME } from '../../lib/constants';
import type { ProtonConfig } from '../../lib/interfaces';

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

const { isProduction, default: initSentry } = await import('../../lib/helpers/sentry');
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

    it('strips a literal hash from the request URL', () => {
        const beforeSend = getBeforeSend();
        const event = { request: { url: 'https://drive.proton.me/urls/TBYS1295RG#secretpass' } } as ErrorEvent;
        // beforeSend also lowercases the URL as part of its separate email-redaction step.
        expect(beforeSend(event)?.request?.url).toEqual('https://drive.proton.me/urls/tbys1295rg');
    });

    it('strips a URL-encoded hash (%23) from the request URL', () => {
        const beforeSend = getBeforeSend();
        const event = { request: { url: 'https://drive.proton.me/urls/TBYS1295RG%23secretpass' } } as ErrorEvent;
        expect(beforeSend(event)?.request?.url).toEqual('https://drive.proton.me/urls/tbys1295rg');
    });

    it('strips a URL-encoded hash from navigation breadcrumbs', () => {
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
        expect(result?.breadcrumbs?.[0].data?.from).toEqual('https://drive.proton.me/urls/AAA');
        expect(result?.breadcrumbs?.[0].data?.to).toEqual('https://drive.proton.me/urls/BBB');
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
