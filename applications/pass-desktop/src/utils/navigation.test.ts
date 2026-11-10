import { getLoggableUrl, getOriginHref } from './navigation';

describe('getLoggableUrl', () => {
    test('should drop the fragment carrying the device fork payload', () => {
        const url =
            'https://account.example.com/desktop/login?app=pass&pt=offline#payload=0:ABCDEFGH:fork-key:macos-pass';
        expect(getLoggableUrl(url)).toEqual('https://account.example.com/desktop/login');
    });

    test('should drop the query of a fork request', () => {
        expect(getLoggableUrl('https://account.example.com/authorize?state=abc&app=proton-pass')).toEqual(
            'https://account.example.com/authorize'
        );
    });

    test('should keep a url without query or fragment unchanged', () => {
        expect(getLoggableUrl('https://account.example.com/authorize')).toEqual(
            'https://account.example.com/authorize'
        );
    });
});

describe('getOriginHref', () => {
    const entry = 'file:///app/index.html?';

    test('should keep the account of the local ID route', () => {
        expect(getOriginHref(`${entry}#/u/3`)).toEqual('/u/3');
        expect(getOriginHref(`${entry}#/u/0/`)).toEqual('/u/0');
    });

    test('should keep the account carried by the add account routes', () => {
        expect(getOriginHref(`${entry}#/auth/add?localID=3`)).toEqual('/u/3');
        expect(getOriginHref(`${entry}#/auth/device?localID=0`)).toEqual('/u/0');
    });

    test('should fall back to the lobby without an account', () => {
        expect(getOriginHref(`${entry}#/`)).toEqual('/');
        expect(getOriginHref(`${entry}#/auth/add`)).toEqual('/');
        expect(getOriginHref(`${entry}#/auth/add?localID=abc`)).toEqual('/');
        expect(getOriginHref(entry)).toEqual('/');
    });
});
