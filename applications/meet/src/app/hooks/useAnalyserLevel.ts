import { useEffect, useRef, useState } from 'react';

/** Both are `null` while nothing is being captured. */
export interface AnalyserSource {
    analyser: AnalyserNode | null;
    dataArray: Uint8Array<ArrayBuffer> | null;
}

export const calculateRms = (data: Uint8Array<ArrayBuffer>): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / data.length);

    return Math.pow(Math.min(rms, 1), 0.5);
};

interface UseAnalyserLevelProps {
    /** Read on every frame, so a capture that only starts later still gets picked up */
    getAnalysis: () => AnalyserSource;
    isActive: boolean;
    throttleMs?: number;
    /** Normal speech peaks well below a full scale RMS, so a meter can scale it up to stay readable */
    scale?: number;
}

/**
 * Measures the input level of an analyser, throttled and normalised to 0..1. Acquiring and
 * releasing the analyser stays with the caller: the loop only reads whatever is there.
 */
export const useAnalyserLevel = ({ getAnalysis, isActive, throttleMs = 100, scale = 1 }: UseAnalyserLevelProps) => {
    const [level, setLevel] = useState(0);

    // Through a ref, so an inline getter does not restart the loop on every render.
    const getAnalysisRef = useRef(getAnalysis);
    getAnalysisRef.current = getAnalysis;

    useEffect(() => {
        setLevel(0);

        if (!isActive) {
            return;
        }

        let rafId: number | null = null;
        let lastUpdate = 0;

        const updateLevel = () => {
            const { analyser, dataArray } = getAnalysisRef.current();

            if (analyser && dataArray) {
                analyser.getByteTimeDomainData(dataArray);

                const now = Date.now();
                if (now - lastUpdate >= throttleMs) {
                    setLevel(Math.min(calculateRms(dataArray) * scale, 1));
                    lastUpdate = now;
                }
            }

            rafId = requestAnimationFrame(updateLevel);
        };

        rafId = requestAnimationFrame(updateLevel);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [isActive, throttleMs, scale]);

    return level;
};
