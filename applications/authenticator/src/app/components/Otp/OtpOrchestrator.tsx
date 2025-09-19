import type { FC, ReactNode } from 'react';
import { createContext, useEffect, useRef } from 'react';

import type { IOtpRenderer } from '@proton/pass/components/Otp/types';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import type { PubSub } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';

interface IOtpOrchestrator {
    /** Registers an OTP renderer in the orchestrator's rendering pipeline.
     * For efficiency, only the first canvas per period gets actively drawn.
     * All subsequent canvases with the same period share the canvas buffer
     * from the first canvas, reducing computation for large number of OTPs. */
    registerRenderer: (options: {
        renderer: IOtpRenderer;
        period: number;
        onEvent?: (evt: OtpEvent) => void;
    }) => () => void;
}

const REFRESH_RATE = 1_000 / 24;

export type OtpEvent = { period: number; remaining: number };

type OtpOrchestratorRef = {
    /** OTP renderers indexed by period */
    renderers: Map<number, Set<IOtpRenderer>>;
    /** Current animation frame request ID */
    request: MaybeNull<number>;
    /** Timestamp of last rendered frame */
    lastFrameTime: number;
    /** Pub-sub for time remaining */
    pubsub: PubSub<OtpEvent>;
};

export const OTPOrchestratorContext = createContext<MaybeNull<IOtpOrchestrator>>(null);
export const useOTPOrchestrator = createUseContext(OTPOrchestratorContext);

export const OTPOrchestrator: FC<{ children: ReactNode }> = ({ children }) => {
    const stateRef = useRef<OtpOrchestratorRef>({
        renderers: new Map(),
        request: null,
        lastFrameTime: 0,
        pubsub: createPubSub<OtpEvent>(),
    });

    const tick = (currentTime: number) => {
        const { renderers, lastFrameTime } = stateRef.current;
        const delta = currentTime - lastFrameTime;

        if (delta < REFRESH_RATE) return (stateRef.current.request = requestAnimationFrame(tick));

        stateRef.current.lastFrameTime = currentTime;

        const now = Date.now() / 1000;

        renderers.forEach((rendererSet, period) => {
            if (rendererSet.size === 0) return;

            const remaining = period - (now % period);
            const percent = remaining / period;
            const countdown = Math.round(percent * period);

            stateRef.current.pubsub.publish({ period, remaining });

            let active: Maybe<HTMLCanvasElement>;
            for (const renderer of rendererSet) {
                const canvas = renderer.getCanvas();
                if (!canvas) continue;

                if (!active) renderer.draw(percent, period);
                else renderer.drawFrom(countdown, active);

                active = active ?? canvas;
            }
        });

        stateRef.current.request = requestAnimationFrame(tick);
    };

    const orchestrator = useRef<IOtpOrchestrator>({
        registerRenderer: ({ renderer, period, onEvent }) => {
            const { renderers } = stateRef.current;
            const group = renderers.get(period) ?? new Set();
            renderers.set(period, group.add(renderer));

            const unsub = onEvent ? stateRef.current.pubsub.subscribe(onEvent) : null;

            return () => {
                unsub?.();
                group.delete(renderer);
                if (group.size === 0) renderers.delete(period);
            };
        },
    });

    useEffect(() => {
        stateRef.current.request = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(stateRef.current.request ?? -1);
    }, []);

    return <OTPOrchestratorContext.Provider value={orchestrator.current}>{children}</OTPOrchestratorContext.Provider>;
};
