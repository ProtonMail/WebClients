import { useEffect, useState } from 'react';

import type { CatTrick } from './catPose';
import { CAT_TRICK_MS } from './catSpriteManifest';

export const useCatTrick = (canPlay: boolean) => {
    const [trick, setTrick] = useState<CatTrick | null>(null);

    useEffect(() => {
        if (!trick) {
            return;
        }
        const timeout = window.setTimeout(() => setTrick(null), CAT_TRICK_MS[trick]);
        return () => window.clearTimeout(timeout);
    }, [trick]);

    useEffect(() => {
        if (!canPlay) {
            setTrick(null);
        }
    }, [canPlay]);

    const playTrick = (next: CatTrick) => {
        if (canPlay) {
            setTrick(next);
        }
    };

    return { trick, playTrick };
};
