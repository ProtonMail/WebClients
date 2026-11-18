import { sendLocaleToDesktopApp } from './sendLocaleToDesktopApp';

describe('sendLocaleToDesktopApp', () => {
    afterEach(() => {
        delete window.ipcMeetMessageBroker;
    });

    it('sends English to the desktop app like any other locale', () => {
        const setLocale = vi.fn();
        window.ipcMeetMessageBroker = { setLocale };

        sendLocaleToDesktopApp('en_US');
        sendLocaleToDesktopApp('es_ES');

        expect(setLocale.mock.calls).toEqual([['en_US'], ['es_ES']]);
    });

    it('does nothing in a browser, where there is no desktop app', () => {
        expect(() => sendLocaleToDesktopApp('de_DE')).not.toThrow();
    });
});
