import { getAppHref } from '../../lib/apps/helper';
import { APPS } from '../../lib/constants';

const location = {
    hostname: 'calendar.protonmail.com',
    protocol: 'https:',
    port: '',
};
describe('sso app href', () => {
    it('should produce links relative to the current second level domain', () => {
        expect(getAppHref('/', APPS.PROTONACCOUNT, undefined, location)).toBe(`https://account.protonmail.com`);
    });

    it('should produce links relative to localhost', () => {
        const location = {
            hostname: 'localhost',
            protocol: 'http:',
            port: '',
        };
        expect(getAppHref('/', APPS.PROTONACCOUNT, undefined, location)).toBe(`http://account.localhost`);
    });

    it('should produce links relative to the current top domain', () => {
        const location = {
            hostname: 'protonmail.com',
            protocol: 'https:',
            port: '',
        };
        expect(getAppHref('/', APPS.PROTONACCOUNT, undefined, location)).toBe(`https://account.protonmail.com`);
    });

    it('should produce links relative to the current domain, with a local id', () => {
        expect(getAppHref('/', APPS.PROTONACCOUNT, 1, location)).toBe(`https://account.protonmail.com/u/1`);
    });

    it('should produce links to other apps', () => {
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.protonmail.com/u/2`);
    });

    it('should produce links to other apps with another location', () => {
        const location = {
            hostname: 'test.com',
            protocol: 'https:',
            port: '',
        };
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.test.com/u/2`);
    });

    it('should produce links respecting the port', () => {
        const location = {
            hostname: 'test.com',
            protocol: 'https:',
            port: '4443',
        };
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.test.com:4443/u/2`);
    });

    it('should produce links to other apps with another location', () => {
        const location = {
            hostname: 'test.com',
            protocol: 'https:',
            port: '',
        };
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.test.com/u/2`);
    });

    it('should override protonvpn hostname', () => {
        const location = {
            hostname: 'account.protonvpn.com',
            protocol: 'https:',
            port: '',
        };
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.proton.me/u/2`);
    });

    it('should produce links stripping previous local id basenames', () => {
        const location = {
            hostname: 'account.protonmail.com',
            protocol: 'https:',
            port: '',
        };
        expect(getAppHref('/u/0/mail', APPS.PROTONACCOUNT, 2, location)).toBe(
            `https://account.protonmail.com/u/2/mail`
        );
        expect(getAppHref('/u/0/mail', APPS.PROTONACCOUNT, 0, location)).toBe(
            `https://account.protonmail.com/u/0/mail`
        );
    });
});
