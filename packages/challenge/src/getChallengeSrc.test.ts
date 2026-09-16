import { CHALLENGE_PATHNAME, getChallengeSrc } from './getChallengeSrc';

const BASE = `https://api.proton.test${CHALLENGE_PATHNAME}`;

describe('getChallengeSrc', () => {
    it('points at the v5 document', () => {
        expect(CHALLENGE_PATHNAME).toBe('/challenge/v5/html');
    });

    it('applies the parameters to the given url', () => {
        const src = new URL(getChallengeSrc(BASE, { type: 0, name: 'email', lang: 'en', dir: 'rtl' }));

        expect(src.origin + src.pathname).toBe(BASE);
        expect(src.searchParams.get('Type')).toBe('0');
        expect(src.searchParams.get('Name')).toBe('email');
        expect(src.searchParams.get('Lang')).toBe('en');
        expect(src.searchParams.get('Dir')).toBe('rtl');
    });

    it('leaves out the optional parameters', () => {
        const src = new URL(getChallengeSrc(BASE, { type: 0, name: 'email' }));

        expect(src.searchParams.get('Lang')).toBeNull();
        expect(src.searchParams.get('Dir')).toBeNull();
        expect(src.searchParams.get('Retry')).toBeNull();
    });

    it('only sets Retry once there has been one', () => {
        expect(
            new URL(getChallengeSrc(BASE, { type: 0, name: 'email', retry: 0 })).searchParams.get('Retry')
        ).toBeNull();
        expect(new URL(getChallengeSrc(BASE, { type: 0, name: 'email', retry: 2 })).searchParams.get('Retry')).toBe(
            '2'
        );
    });

    it('accepts a URL and does not mutate it', () => {
        const url = new URL(BASE);

        getChallengeSrc(url, { type: 0, name: 'email' });

        expect(url.search).toBe('');
    });
});
