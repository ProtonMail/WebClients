import { APPS } from '../../lib/constants';
import { getAppHref } from '../../lib/apps/helper';

const domain = 'localhost';
const protocol = 'http://';

describe('sso app href', () => {
    it('should produce links relative to the current domain', () => {
        expect(getAppHref('/', APPS.PROTONACCOUNT)).toBe(`${protocol}account.${domain}`);
    });

    it('should produce links relative to the current domain, with a local id', () => {
        expect(getAppHref('/', APPS.PROTONACCOUNT, 1)).toBe(`${protocol}account.${domain}/u/1`);
    });

    it('should produce links to other apps', () => {
        expect(getAppHref('/', APPS.PROTONCALENDAR, 2)).toBe(`${protocol}calendar.${domain}/u/2`);
    });
});
