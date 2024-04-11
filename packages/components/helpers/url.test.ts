import {
    getHostname,
    isExternal,
    isMailTo,
    isSubDomain,
    isURLProtonInternal,
    punycodeUrl,
} from '@proton/components/helpers/url';

const windowHostname = 'mail.proton.me';

describe('isSubDomain', function () {
    it('should detect that same hostname is a subDomain', () => {
        const hostname = 'mail.proton.me';
        expect(isSubDomain(hostname, hostname)).toBeTruthy();
    });

    it('should detect that domain is a subDomain', () => {
        const hostname = 'mail.proton.me';
        const domain = 'proton.me';
        expect(isSubDomain(hostname, domain)).toBeTruthy();
    });

    it('should detect that domain is not a subDomain', () => {
        const hostname = 'mail.proton.me';
        const domain = 'whatever.com';
        expect(isSubDomain(hostname, domain)).toBeFalsy();
    });
});

describe('getHostname', function () {
    it('should give the correct hostname', () => {
        const hostname = 'mail.proton.me';
        const url = `https://${hostname}/u/0/inbox`;
        expect(getHostname(url)).toEqual(hostname);
    });
});

describe('isMailTo', function () {
    it('should detect that the url is a mailto link', () => {
        const url = 'mailto:mail@proton.me';
        expect(isMailTo(url)).toBeTruthy();
    });

    it('should detect that the url is not a mailto link', () => {
        const url = 'https://proton.me';
        expect(isMailTo(url)).toBeFalsy();
    });
});

describe('isExternal', function () {
    it('should detect that the url is not external', () => {
        const url1 = 'https://mail.proton.me';
        expect(isExternal(url1, windowHostname)).toBeFalsy();
    });

    it('should detect that the url is external', () => {
        const url = 'https://url.whatever.com';
        expect(isExternal(url, windowHostname)).toBeTruthy();
    });

    it('should detect that the mailto link is not external', () => {
        const url = 'mailto:mail@proton.me';
        expect(isExternal(url, windowHostname)).toBeFalsy();
    });
});

describe('isProtonInternal', function () {
    it('should detect that the url is proton internal', () => {
        const url1 = 'https://mail.proton.me';
        const url2 = 'https://calendar.proton.me';

        expect(isURLProtonInternal(url1, windowHostname)).toBeTruthy();
        expect(isURLProtonInternal(url2, windowHostname)).toBeTruthy();
    });

    it('should detect that the url is not proton internal', () => {
        const url = 'https://url.whatever.com';

        expect(isURLProtonInternal(url, windowHostname)).toBeFalsy();
    });
});

describe('punycodeUrl', () => {
    it('should encode the url with punycode', () => {
        // reference: https://www.xudongz.com/blog/2017/idn-phishing/
        const url = 'https://www.аррӏе.com';
        const encodedUrl = punycodeUrl(url);
        expect(encodedUrl).toEqual('https://www.xn--80ak6aa92e.com');
    });

    it('should encode url with punycode and keep pathname, query parameters and fragment', () => {
        const url = 'https://www.äöü.com/ümläüts?ä=ö&ü=ä#ümläüts';
        const encodedUrl = punycodeUrl(url);
        expect(encodedUrl).toEqual(
            'https://www.xn--4ca0bs.com/%C3%BCml%C3%A4%C3%BCts?%C3%A4=%C3%B6&%C3%BC=%C3%A4#%C3%BCml%C3%A4%C3%BCts'
        );
    });

    it('should not encode url already punycode', () => {
        const url = 'https://www.xn--4ca0bs.com';
        const encodedUrl = punycodeUrl(url);
        expect(encodedUrl).toEqual(url);
    });

    it('should not encode url with no punycode', () => {
        const url = 'https://www.protonmail.com';
        const encodedUrl = punycodeUrl(url);
        expect(encodedUrl).toEqual(url);
    });

    it('should keep the trailing slash', () => {
        const url = 'https://www.äöü.com/EDEQWE/';
        const encodedUrl = punycodeUrl(url);
        expect(encodedUrl).toEqual('https://www.xn--4ca0bs.com/EDEQWE/');
    });

    it('should keep the port', () => {
        const url = 'https://www.äöü.com:8080';
        const encodedUrl = punycodeUrl(url);
        expect(encodedUrl).toEqual('https://www.xn--4ca0bs.com:8080');
    });

    it('should keep the trailing slash if hash or search after', () => {
        const sUrl = 'https://www.dude.com/r/?dude=buddy';
        const encodedSUrl = punycodeUrl(sUrl);
        expect(encodedSUrl).toEqual('https://www.dude.com/r/?dude=buddy');

        const hUrl = 'https://www.dude.com/r/#dude';
        const encodedHUrl = punycodeUrl(hUrl);
        expect(encodedHUrl).toEqual('https://www.dude.com/r/#dude');
    });

    it('should keep the trailing slash if string has no punycode', () => {
        const url = 'https://dude.com/?test=something/';
        const encodedUrl = punycodeUrl(url);
        expect(encodedUrl).toEqual(url);
    });
});
