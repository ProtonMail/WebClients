import { APPS } from '@proton/shared/lib/constants';
import { mockWindowLocation, resetWindowLocation } from '@proton/shared/test/helpers/url.helper';

import {
    formatURLForAjaxRequest,
    getApiSubdomainUrl,
    getAppUrlFromApiUrl,
    getAppUrlRelativeToOrigin,
    getRelativeApiHostname,
    getSecondLevelDomain,
    getStaticURL,
    isAppFromURL,
    isValidHttpUrl,
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
    afterEach(() => {
        resetWindowLocation();
    });

    it('should return api subdomain url for localhost', () => {
        mockWindowLocation({ origin: 'https://localhost', hostname: 'localhost' });

        expect(getApiSubdomainUrl(path).href).toEqual(`https://localhost/api${path}`);
    });

    it('should return api subdomain url', () => {
        mockWindowLocation({ hostname: windowHostname });

        expect(getApiSubdomainUrl(path).href).toEqual(`https://mail-api.proton.pink${path}`);
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
    afterEach(() => {
        resetWindowLocation();
    });

    it('should return the static url for localhost', () => {
        mockWindowLocation({ hostname: 'localhost' });

        expect(getStaticURL(path)).toEqual(`https://proton.me${path}`);
    });

    it('should return the correct static url', () => {
        mockWindowLocation({ hostname: windowHostname });

        expect(getStaticURL(path)).toEqual(`https://proton.me${path}`);
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

    afterEach(() => {
        resetWindowLocation();
    });

    it('should add the ajax params to the URL when no params', () => {
        mockWindowLocation({ href: mailUrl });

        expect(formatURLForAjaxRequest().search).toEqual(`?${ajaxParam}`);
    });

    it('should concatenate the ajax params to the URL when params', () => {
        mockWindowLocation({ href: `${mailUrl}${randomParam}` });

        expect(formatURLForAjaxRequest().search).toEqual(`${randomParam}&${ajaxParam}`);
    });
});
