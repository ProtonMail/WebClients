import { useEffect, useState } from 'react';

import type { PanelSide } from '../floating/panelSide';
import type { CatRun, CatTrick } from './catPose';
import { CatJump } from './catPose';
import { useCatRun } from './useCatRun';
import { useCatTrick } from './useCatTrick';

export interface CatMotion {
    run: CatRun | null;
    jump: CatJump | null;
    trick: CatTrick | null;
    isHidden: boolean;
}

interface Options {
    side: PanelSide;
    isCatHidden: boolean;
    canJump: boolean;
    runMs: number;
}

export const useCatMotion = ({ side, isCatHidden, canJump, runMs }: Options) => {
    const canRun = canJump && !isCatHidden;
    const { shownSide, run, endGlide } = useCatRun({ side, canRun, runMs });
    // Lags like the run's side, so the hidden class and the jump animation start together
    const [isHidden, setIsHidden] = useState(isCatHidden);
    const [jump, setJump] = useState<CatJump | null>(null);

    useEffect(() => {
        if (isCatHidden === isHidden) {
            return;
        }
        setIsHidden(isCatHidden);
        setJump(canJump ? (isCatHidden ? CatJump.OUT : CatJump.IN) : null);
    }, [isCatHidden, isHidden, canJump]);

    const { trick, playTrick } = useCatTrick(canRun && !run && !jump);

    const endJump = () => {
        setJump(null);
    };

    const motion: CatMotion = { run, jump, trick, isHidden };
    return { shownSide, motion, endGlide, endJump, playTrick };
};
