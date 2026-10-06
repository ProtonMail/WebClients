import type { EntryRoute, MeetPerformanceValues } from '@proton/meet/telemetry/events';
import { TelemetryMeetPerformanceEvents, sendMeetPerformanceEvent } from '@proton/meet/telemetry/meetTelemetry';

import type { MeetCoreClient } from '../wasm/MeetCoreClient';
import { MeetCoreWorkerClient } from '../wasm/MeetCoreWorkerClient';

type LoadPhase = 'sessionMs' | 'cryptoInitMs' | 'wasmInitMs' | 'unleashMs';

interface LoadState {
    entryRoute: EntryRoute;
    bootstrapStart: number;
    bootstrapEnd?: number;
    bootstrapLoaderUnmount?: number;
    wasmMode?: 'worker' | 'direct';
    phases: Partial<Record<LoadPhase, number>>;
    preload?: 'pending' | 'resolved' | 'rejected';
    isPreloadHit?: boolean | 'n/a';
    wasHidden: boolean;
    sent: boolean;
}

let loadState: LoadState | undefined;

const handleVisibilityChange = () => {
    if (loadState && document.visibilityState === 'hidden') {
        loadState.wasHidden = true;
    }
};

const getEntryRoute = (pathname: string): EntryRoute => {
    const path = pathname.replace(/^\/guest/, '').replace(/^\/u\/\d+/, '');

    if (path.startsWith('/join')) {
        return 'join';
    }
    if (path.startsWith('/manage-recordings')) {
        return 'manage-recordings';
    }
    if (path.startsWith('/start-free-meeting')) {
        return 'start-free-meeting';
    }
    return 'dashboard';
};

const getIsColdStart = (): boolean => {
    const entryScripts = new Set(
        Array.from(document.scripts)
            .map((script) => script.src)
            .filter(Boolean)
    );

    return performance
        .getEntriesByType('resource')
        .some(
            (entry) =>
                entryScripts.has(entry.name) &&
                (entry as PerformanceResourceTiming).transferSize > 0 &&
                (entry as PerformanceResourceTiming & { deliveryType?: string }).deliveryType !== 'cache'
        );
};

const getTtfb = () => {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return navigation?.responseStart;
};

/** Called first thing in the bootstrap, before any redirect changes the route. */
export const markBootstrapStart = () => {
    loadState = {
        entryRoute: getEntryRoute(window.location.pathname),
        bootstrapStart: performance.now(),
        phases: {},
        wasHidden: document.visibilityState === 'hidden',
        sent: false,
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
};

export const markBootstrapEnd = () => {
    if (loadState) {
        loadState.bootstrapEnd = performance.now();
    }
};

export const setWasmMode = (client: MeetCoreClient) => {
    if (loadState) {
        loadState.wasmMode = client instanceof MeetCoreWorkerClient ? 'worker' : 'direct';
    }
};

/** Adds the duration of the promise to the phase, phases made of several steps are summed. */
export const measureLoadPhase = async <T>(phase: LoadPhase, promise: Promise<T>): Promise<T> => {
    const start = performance.now();

    try {
        return await promise;
    } finally {
        if (loadState) {
            loadState.phases[phase] = (loadState.phases[phase] ?? 0) + performance.now() - start;
        }
    }
};

export const trackMeetingInfoPreload = (promise: Promise<unknown>) => {
    if (!loadState) {
        return;
    }

    const state = loadState;
    state.preload = 'pending';

    promise.then(
        () => {
            state.preload = 'resolved';
        },
        () => {
            state.preload = 'rejected';
        }
    );
};

/** Called when the prejoin needs the meeting info, to know whether the preload already had it. */
export const markMeetingInfoNeeded = () => {
    if (!loadState || loadState.isPreloadHit !== undefined) {
        return;
    }

    loadState.isPreloadHit = loadState.preload ? loadState.preload === 'resolved' : 'n/a';
};

const sendAppLoaded = (state: LoadState, prejoinLoaderUnmount?: number) => {
    state.sent = true;
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    if (state.wasHidden || document.visibilityState === 'hidden' || !state.wasmMode) {
        return;
    }

    const { bootstrapEnd, bootstrapLoaderUnmount = 0 } = state;

    const values: MeetPerformanceValues[TelemetryMeetPerformanceEvents.app_loaded] = {
        ttfbMs: getTtfb(),
        bootstrapStartMs: state.bootstrapStart,
        ...state.phases,
        interactiveMs: bootstrapEnd !== undefined ? bootstrapLoaderUnmount - bootstrapEnd : undefined,
        totalMs: bootstrapLoaderUnmount,
        prejoinReadyMs: prejoinLoaderUnmount !== undefined ? prejoinLoaderUnmount - bootstrapLoaderUnmount : undefined,
    };

    sendMeetPerformanceEvent(
        TelemetryMeetPerformanceEvents.app_loaded,
        {
            entryRoute: state.entryRoute,
            wasmMode: state.wasmMode,
            isColdStart: getIsColdStart(),
            isPreloadHit: state.entryRoute === 'join' ? (state.isPreloadHit ?? 'n/a') : 'n/a',
        },
        values
    );
};

export const markBootstrapLoaderUnmount = () => {
    if (!loadState || loadState.sent || loadState.bootstrapEnd === undefined) {
        return;
    }

    loadState.bootstrapLoaderUnmount = performance.now();

    // On /join the load only ends once the meeting info loader is gone
    if (loadState.entryRoute !== 'join') {
        sendAppLoaded(loadState);
    }
};

export const markPrejoinLoaderUnmount = () => {
    if (!loadState || loadState.sent || loadState.bootstrapLoaderUnmount === undefined) {
        return;
    }

    sendAppLoaded(loadState, performance.now());
};
