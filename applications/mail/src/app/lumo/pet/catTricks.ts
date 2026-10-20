import { normalize } from '@proton/shared/lib/helpers/string';

import { CatTrick } from './catPose';

const SCHRODINGER_OUTCOMES = [CatTrick.SCHRODINGER_IN_BOX, CatTrick.SCHRODINGER_OUT_OF_BOX];

const TRICK_PHRASES = new Map([
    ['schrodinger', SCHRODINGER_OUTCOMES],
    ['schrodingers cat', SCHRODINGER_OUTCOMES],
    ['nine lives', [CatTrick.NINE_LIVES]],
    ['encrypt', [CatTrick.ENCRYPT]],
]);

export const matchCatTrick = (message: string): CatTrick | null => {
    const phrase = normalize(message, true)
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const tricks = TRICK_PHRASES.get(phrase);
    if (!tricks) {
        return null;
    }
    return tricks[Math.floor(Math.random() * tricks.length)];
};
