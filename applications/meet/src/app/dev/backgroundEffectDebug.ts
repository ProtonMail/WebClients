import type { BackgroundDebugView } from '../processors/background-processor/types';

interface DebugTarget {
    setDebugView: (view: BackgroundDebugView) => void;
}

interface MeetBackgroundEffectDebug {
    setView: (view: BackgroundDebugView) => void;
    readonly view: BackgroundDebugView;
}

declare global {
    interface Window {
        meetBackgroundEffectDebug?: MeetBackgroundEffectDebug;
    }
}

const targets = new Set<DebugTarget>();

let currentView: BackgroundDebugView = 'composite';

export const registerBackgroundEffectDebug = (target: DebugTarget) => {
    if (process.env.NODE_ENV === 'production') {
        return () => {};
    }

    window.meetBackgroundEffectDebug ??= {
        setView: (view) => {
            currentView = view;
            targets.forEach((registered) => registered.setDebugView(view));
        },
        get view() {
            return currentView;
        },
    };
    targets.add(target);
    target.setDebugView(currentView);

    return () => {
        targets.delete(target);
    };
};
