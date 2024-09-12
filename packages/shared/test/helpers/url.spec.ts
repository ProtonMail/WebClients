import { APPS } from '@proton/shared/lib/constants';
import { getMockedWindowLocation } from '@proton/shared/test/helpers/url.helper';

import {
    formatURLForAjaxRequest,
    getApiSubdomainUrl,
    getAppUrlFromApiUrl,
    getAppUrlRelativeToOrigin,
    getPathFromLocation,
    getRelativeApiHostname,
    getSecondLevelDomain,
    getStaticURL,
    getUrlWithReturnUrl,
    isAppFromURL,
    isValidHttpUrl,
    stringifySearchParams,
} from '../../lib/helpers/url';

const mailUrl = 'https://mail.proton.me';
const windowHostname = 'mail.proton.me';
const path = '/somePath';

describe('getSecondLevelDomain', () => {
    it('should return second level domain', () => {
        expect(getSecondLevelDomain(windowHostname)).toEqual('proton.me');
    });
});

describe('getRelativeApiHostname', () => {
    it('should return api hostname', () => {
        expect(getRelativeApiHostname(mailUrl)).toEqual(`https://mail-api.proton.me`);
    });
});

describe('getApiSubdomainUrl', () => {
    it('should return api subdomain url for localhost', () => {
        expect(getApiSubdomainUrl(path, 'https://localhost').href).toEqual(`https://localhost/api${path}`);
    });

    it('should return api subdomain url for DoH', () => {
        expect(getApiSubdomainUrl(path, 'https://34-234.whatever.compute.amazonaws.com').href).toEqual(
            `https://34-234.whatever.compute.amazonaws.com/api${path}`
        );
    });

    it('should return api subdomain url for DoH IPv4', () => {
        expect(getApiSubdomainUrl(path, 'https://34.234.12.145').href).toEqual(`https://34.234.12.145/api${path}`);
    });

    it('should return api subdomain url for DoH IPv4 with port', () => {
        expect(getApiSubdomainUrl(path, 'https://34.234.12.145:65').href).toEqual(
            `https://34.234.12.145:65/api${path}`
        );
    });

    it('should return api subdomain url for DoH IPv6', () => {
        expect(getApiSubdomainUrl(path, 'https://[2001:db8::8a2e:370:7334]').href).toEqual(
            `https://[2001:db8::8a2e:370:7334]/api${path}`
        );
    });

    it('should return api subdomain url for DoH IPv6 with port', () => {
        expect(getApiSubdomainUrl(path, 'https://[2001:db8::8a2e:370:7334]:65').href).toEqual(
            `https://[2001:db8::8a2e:370:7334]:65/api${path}`
        );
    });

    it('should return api subdomain url', () => {
        expect(getApiSubdomainUrl(path, 'https://mail.proton.pink').href).toEqual(
            `https://mail-api.proton.pink${path}`
        );
    });
});

describe('getAppUrlFromApiUrl', () => {
    it('should return app Url from api url', () => {
        expect(getAppUrlFromApiUrl('https://mail.proton.me/api', APPS.PROTONMAIL).href).toEqual(`${mailUrl}/`);
    });
});

describe('getAppUrlRelativeToOrigin', () => {
    it('should return app url relative to origin', () => {
        expect(getAppUrlRelativeToOrigin(`${mailUrl}${path}`, APPS.PROTONDRIVE).href).toEqual(
            `https://drive.proton.me${path}`
        );
    });
});

describe('getStaticURL', () => {
    it('should return the static url for localhost', () => {
        const location = getMockedWindowLocation({ hostname: 'localhost' });
        expect(getStaticURL(path, location)).toEqual(`https://proton.me${path}`);
    });

    it('should return the correct static url', () => {
        const location = getMockedWindowLocation({ hostname: windowHostname });
        expect(getStaticURL(path, location)).toEqual(`https://proton.me${path}`);
    });
});

describe('isValidHttpUrl', () => {
    it('should be a valid HTTP url', () => {
        const httpsUrl = mailUrl;
        const httpUrl = 'http://mail.proton.me';

        expect(isValidHttpUrl(httpsUrl)).toBeTruthy();
        expect(isValidHttpUrl(httpUrl)).toBeTruthy();
    });

    it('should not be a valid HTTP url', () => {
        const string = 'invalid';

        expect(isValidHttpUrl(string)).toBeFalsy();
    });
});

describe('isAppFromURL', () => {
    it('should be a URL from the current app', () => {
        expect(isAppFromURL(mailUrl, APPS.PROTONMAIL)).toBeTruthy();
    });

    it('should not be a URL from the current app', () => {
        expect(isAppFromURL(mailUrl, APPS.PROTONCALENDAR)).toBeFalsy();
    });
});

describe('formatURLForAjaxRequest', () => {
    const ajaxParam = 'load=ajax';
    const randomParam = '?someParam=param';

    it('should add the ajax params to the URL when no params', () => {
        expect(formatURLForAjaxRequest(mailUrl).search).toEqual(`?${ajaxParam}`);
    });

    it('should concatenate the ajax params to the URL when params', () => {
        expect(formatURLForAjaxRequest(`${mailUrl}${randomParam}`).search).toEqual(`${randomParam}&${ajaxParam}`);
    });

    it('should preserve existing search params', () => {
        const url = `${mailUrl}${randomParam}&${ajaxParam}`;
        expect(formatURLForAjaxRequest(url).search).toEqual(`${randomParam}&${ajaxParam}`);
    });

    it('should support additional URL parameters, and override if needed', () => {
        const url = `${mailUrl}${randomParam}`;
        expect(formatURLForAjaxRequest(url, { extra: 'param', load: 'modalOpen' }).search).toEqual(
            `${randomParam}&extra=param&load=modalOpen`
        );
    });
});

describe('stringifySearchParams()', () => {
    it('should not stringify empty values', () => {
        expect(
            stringifySearchParams({
                plan: '',
                currency: undefined,
            })
        ).toBe('');
    });

    it('should not stringify empty values with value', () => {
        expect(
            stringifySearchParams({
                plan: '',
                currency: undefined,
                coupon: 'test',
            })
        ).toBe('coupon=test');
    });
});

describe('getUrlWithReturnUrl', () => {
    it('should get passed url with returnUrl and returnUrlContext as search parameter', () => {
        const location = { pathname: '/somePath', search: '?search=MySearch', hash: '#hash' } as Location;
        const expectedUrl = 'https://mail.proton.me/?returnUrl=%2FsomePath%3Fsearch%3DMySearch%23hash';
        expect(getUrlWithReturnUrl(mailUrl, { returnUrl: getPathFromLocation(location) })).toEqual(expectedUrl);
    });

    it('should be a URL from the current app with public context', () => {
        const location = { pathname: '/somePath', search: '?search=MySearch', hash: '#hash' } as Location;
        const expectedUrl =
            'https://mail.proton.me/?returnUrl=%2FsomePath%3Fsearch%3DMySearch%23hash&returnUrlContext=public';
        expect(getUrlWithReturnUrl(mailUrl, { returnUrl: getPathFromLocation(location), context: 'public' })).toEqual(
            expectedUrl
        );
    });
});
