import { getEventNotifierUrl } from '../../lib/eventNotifier/getEventNotifierUrl';

const headers = { 'x-pm-uid': 'uid-1', 'x-pm-appversion': 'web-mail@5.0.0' };

describe('getEventNotifierUrl', () => {
    it('should build the url from a relative api url', () => {
        expect(getEventNotifierUrl({ apiUrl: '/api', origin: 'https://mail.proton.me', headers: {} })).toBe(
            'https://mail.proton.me/api/event-notifier/v1/events'
        );
    });

    it('should build the url from an absolute api url', () => {
        expect(
            getEventNotifierUrl({
                apiUrl: 'https://mail.proton.me/api',
                origin: 'https://account.proton.me',
                headers: {},
            })
        ).toBe('https://mail.proton.me/api/event-notifier/v1/events');
    });

    it('should keep the protocol and the port of the origin', () => {
        expect(getEventNotifierUrl({ apiUrl: '/api', origin: 'http://localhost:8080', headers: {} })).toBe(
            'http://localhost:8080/api/event-notifier/v1/events'
        );
    });

    it('should not duplicate the separator of a trailing slash', () => {
        expect(getEventNotifierUrl({ apiUrl: '/api/', origin: 'https://mail.proton.me', headers: {} })).toBe(
            'https://mail.proton.me/api/event-notifier/v1/events'
        );
    });

    it('should pass the headers as query parameters, since EventSource cannot send them', () => {
        const url = new URL(getEventNotifierUrl({ apiUrl: '/api', origin: 'https://mail.proton.me', headers }));

        expect(url.pathname).toBe('/api/event-notifier/v1/events');
        expect(url.searchParams.get('x-pm-uid')).toBe('uid-1');
        expect(url.searchParams.get('x-pm-appversion')).toBe('web-mail@5.0.0');
    });
});
