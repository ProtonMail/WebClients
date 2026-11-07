import { getHidesSignUpPrompt } from './signUpSearchParameter';

describe('getHidesSignUpPrompt', () => {
    it('hides the sign-up prompt with signup=0', () => {
        expect(getHidesSignUpPrompt(new URLSearchParams('signup=0'))).toBe(true);
    });

    it('reads the initial search parameters, as passed to /authorize', () => {
        expect(getHidesSignUpPrompt(new URLSearchParams(), new URLSearchParams('app=x&signup=0'))).toBe(true);
    });

    it.each(['', 'signup=1', 'signup=false', 'signup='])('keeps the sign-up prompt with "%s"', (search) => {
        expect(getHidesSignUpPrompt(new URLSearchParams(search), undefined)).toBe(false);
    });
});
