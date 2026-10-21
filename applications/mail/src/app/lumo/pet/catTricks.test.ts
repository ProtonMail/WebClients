import { CatTrick } from './catPose';
import { matchCatTrick } from './catTricks';

describe('matchCatTrick', () => {
    const pinRandom = (value: number) => jest.spyOn(Math, 'random').mockReturnValue(value);

    afterEach(() => jest.restoreAllMocks());

    it.each([
        ["Schrödinger's cat!", CatTrick.SCHRODINGER_IN_BOX],
        ['  NINE   lives. ', CatTrick.NINE_LIVES],
        ['Encrypt?', CatTrick.ENCRYPT],
        ['encrypt !', CatTrick.ENCRYPT],
    ])('matches %p', (message, trick) => {
        pinRandom(0);

        expect(matchCatTrick(message)).toBe(trick);
    });

    it('opens the box on either outcome at random', () => {
        pinRandom(0);
        expect(matchCatTrick('schrödinger')).toBe(CatTrick.SCHRODINGER_IN_BOX);

        pinRandom(0.99);
        expect(matchCatTrick('schrödinger')).toBe(CatTrick.SCHRODINGER_OUT_OF_BOX);
    });

    it.each(['encrypt this email', 'find my nine lives receipts', '', 'constructor'])(
        'ignores %p, which is a real request or no phrase at all',
        (message) => {
            expect(matchCatTrick(message)).toBeNull();
        }
    );
});
