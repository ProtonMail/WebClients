import { getHostname, isExternal, isMailTo, isSubDomain, isURLProtonInternal } from '@proton/components/helpers/url';

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
    const windowHostname = 'mail.proton.me';

    beforeEach(() => {
        global.window = Object.create(window);
        Object.defineProperty(window, 'location', {
            value: {
                hostname: windowHostname,
            },
        });
    });

    it('should detect that the url is not external', () => {
        const url1 = 'https://mail.proton.me';
        expect(window.location.hostname).toEqual(windowHostname);
        expect(isExternal(url1)).toBeFalsy();
    });

    it('should detect that the url is external', () => {
        const url = 'https://url.whatever.com';
        expect(window.location.hostname).toEqual(windowHostname);
        expect(isExternal(url)).toBeTruthy();
    });

    it('should detect that the mailto link is not external', () => {
        const url = 'mailto:mail@proton.me';
        expect(window.location.hostname).toEqual(windowHostname);
        expect(isExternal(url)).toBeFalsy();
    });
});

describe('isProtonInternal', function () {
    const windowHostname = 'mail.proton.me';

    beforeEach(() => {
        global.window = Object.create(window);
        Object.defineProperty(window, 'location', {
            value: {
                hostname: windowHostname,
            },
        });
    });

    it('should detect that the url is proton internal', () => {
        const url1 = 'https://mail.proton.me';
        const url2 = 'https://calendar.proton.me';

        expect(isURLProtonInternal(url1)).toBeTruthy();
        expect(isURLProtonInternal(url2)).toBeTruthy();
    });

    it('should detect that the url is not proton internal', () => {
        const url = 'https://url.whatever.com';

        expect(isURLProtonInternal(url)).toBeFalsy();
    });
});
