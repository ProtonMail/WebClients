import { CHALLENGE_PATHNAME, getChallengeSrc } from './getChallengeSrc';

describe('getChallengeSrc', () => {
    it('points at the v4 document', () => {
        expect(CHALLENGE_PATHNAME).toBe('/challenge/v4/html');
    });

    it('applies the parameters to the given url', () => {
        const src = new URL(
            getChallengeSrc(`https://api.proton.test${CHALLENGE_PATHNAME}`, { type: 0, name: 'email' })
        );

        expect(src.pathname).toBe(CHALLENGE_PATHNAME);
        expect(src.searchParams.get('Type')).toBe('0');
        expect(src.searchParams.get('Name')).toBe('email');
    });
});
