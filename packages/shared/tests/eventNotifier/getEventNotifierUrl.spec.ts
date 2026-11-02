import { getEventNotifierConnectionUrl, getEventNotifierUrl } from '../../lib/eventNotifier/getEventNotifierUrl';

describe('getEventNotifierUrl', () => {
    it('should build the url from a relative api url', () => {
        expect(getEventNotifierUrl({ apiUrl: '/api', origin: 'https://mail.proton.me' })).toBe(
            'https://mail.proton.me/api/event-notifier/v1/events'
        );
    });

    it('should build the url from an absolute api url', () => {
        expect(
            getEventNotifierUrl({
                apiUrl: 'https://mail.proton.me/api',
                origin: 'https://account.proton.me',
            })
        ).toBe('https://mail.proton.me/api/event-notifier/v1/events');
    });

    it('should keep the protocol and the port of the origin', () => {
        expect(getEventNotifierUrl({ apiUrl: '/api', origin: 'http://localhost:8080' })).toBe(
            'http://localhost:8080/api/event-notifier/v1/events'
        );
    });

    it('should not duplicate the separator of a trailing slash', () => {
        expect(getEventNotifierUrl({ apiUrl: '/api/', origin: 'https://mail.proton.me' })).toBe(
            'https://mail.proton.me/api/event-notifier/v1/events'
        );
    });
});

describe('getEventNotifierConnectionUrl', () => {
    it('should pass the connection token as a query parameter, since EventSource cannot send headers', () => {
        const url = new URL(
            getEventNotifierConnectionUrl('https://mail.proton.me/api/event-notifier/v1/events', 'a.b+c/d')
        );

        expect(url.pathname).toBe('/api/event-notifier/v1/events');
        expect(url.searchParams.get('ConnectionToken')).toBe('a.b+c/d');
        expect([...url.searchParams.keys()]).toEqual(['ConnectionToken']);
    });
});
