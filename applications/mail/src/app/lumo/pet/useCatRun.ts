import { useEffect, useState } from 'react';

import type { PanelSide } from '../floating/panelSide';
import { CatRun } from './catPose';

export const SKID_LEAD_MS = 250;

interface Options {
    side: PanelSide;
    canRun: boolean;
    runMs: number;
}

export const useCatRun = ({ side, canRun, runMs }: Options) => {
    // The move lands in the same render as the gallop, so the glide starts from the old side
    const [shownSide, setShownSide] = useState(side);
    const [run, setRun] = useState<CatRun | null>(null);

    useEffect(() => {
        if (side === shownSide) {
            return;
        }
        setShownSide(side);
        setRun(canRun ? CatRun.GALLOP : null);
    }, [side, shownSide, canRun]);

    useEffect(() => {
        if (!canRun) {
            setRun(null);
        }
    }, [canRun]);

    useEffect(() => {
        if (run !== CatRun.GALLOP) {
            return;
        }
        const timeout = window.setTimeout(() => setRun(CatRun.SKID), runMs - SKID_LEAD_MS);
        return () => window.clearTimeout(timeout);
    }, [run, runMs, shownSide]);

    // The glide's transitionend never fires with Proton's animations off or a 0ms run, so time the end too
    const isRunning = run !== null;
    useEffect(() => {
        if (!isRunning) {
            return;
        }
        const timeout = window.setTimeout(() => setRun(null), runMs);
        return () => window.clearTimeout(timeout);
    }, [isRunning, shownSide, runMs]);

    const endGlide = () => {
        setRun(null);
    };

    return { shownSide, run, endGlide };
};
