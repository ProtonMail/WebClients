import { getAuthActionAccountPath } from './authActionPath';

describe('getAuthActionAccountPath', () => {
    it('adds remember=3 to the sign-in navigation inside the native mobile app', () => {
        // remember=3 maps to the account login RememberMode.HiddenEnabled: the "Keep me signed in"
        // checkbox is hidden and forced on, which is what we want for a login inside the app.
        expect(getAuthActionAccountPath({ action: 'signin', basePath: '', isMobileApp: true })).toBe('?remember=3');
    });

    it('leaves the sign-in navigation untouched in a normal browser', () => {
        expect(getAuthActionAccountPath({ action: 'signin', basePath: '', isMobileApp: false })).toBe('');
    });

    it('does not add remember to the sign-up navigation', () => {
        expect(getAuthActionAccountPath({ action: 'signup', basePath: '/signup', isMobileApp: true })).toBe('/signup');
    });

    it('appends with & when the base path already has a query string', () => {
        expect(getAuthActionAccountPath({ action: 'signin', basePath: '?foo=bar', isMobileApp: true })).toBe(
            '?foo=bar&remember=3'
        );
    });

    it('does not add a second remember param when the base path already has one', () => {
        expect(getAuthActionAccountPath({ action: 'signin', basePath: '?remember=1', isMobileApp: true })).toBe(
            '?remember=1'
        );
    });
});
