import { APPS } from '../../lib/constants';
import { getAppHref } from '../../lib/apps/helper';

const location = {
    hostname: 'calendar.protonmail.com',
    protocol: 'https:',
};
describe('sso app href', () => {
    it('should produce links relative to the current second level domain', () => {
        expect(getAppHref('/', APPS.PROTONACCOUNT, undefined, location)).toBe(`https://account.protonmail.com`);
    });

    it('should produce links relative to localhost', () => {
        const location = {
            hostname: 'localhost',
            protocol: 'http:',
        };
        expect(getAppHref('/', APPS.PROTONACCOUNT, undefined, location)).toBe(`http://account.localhost`);
    });

    it('should produce links relative to the current top domain', () => {
        const location = {
            hostname: 'protonmail.com',
            protocol: 'https:',
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
        };
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.test.com/u/2`);
    });

    it('should produce links to other apps with another location', () => {
        const location = {
            hostname: 'test.com',
            protocol: 'https:',
        };
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.test.com/u/2`);
    });

    it('should override protonvpn hostname', () => {
        const location = {
            hostname: 'account.protonvpn.com',
            protocol: 'https:',
        };
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2, location)).toBe(`https://calendar.protonmail.com/u/2`);
    });
});
