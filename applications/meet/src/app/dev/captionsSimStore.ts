import { useSyncExternalStore } from 'react';

/**
 * Shared state between the `meetEventSim.captions` console tool and the captions UI. Stays `off`
 * unless the tool is used, which never happens in production builds.
 */

export type CaptionsSimStatus = 'off' | 'loading' | 'ready' | 'failing' | 'disconnected';

export interface CaptionsSimSegment {
    id: string;
    text: string;
    speakerIdentity: string;
    isFinal: boolean;
}

export type CaptionsSimEvent = { type: 'segment'; segment: CaptionsSimSegment } | { type: 'clear' };

export const CAPTIONS_SIM_ID_PREFIX = '__captions_sim__';

let status: CaptionsSimStatus = 'off';
let microphoneUnavailable = false;
const statusListeners = new Set<() => void>();
const eventListeners = new Set<(event: CaptionsSimEvent) => void>();

export const getCaptionsSimStatus = () => status;

export const setCaptionsSimStatus = (next: CaptionsSimStatus) => {
    if (status === next) {
        return;
    }
    status = next;
    statusListeners.forEach((listener) => listener());
};

export const getCaptionsSimMicrophoneUnavailable = () => microphoneUnavailable;

export const setCaptionsSimMicrophoneUnavailable = (next: boolean) => {
    if (microphoneUnavailable === next) {
        return;
    }
    microphoneUnavailable = next;
    statusListeners.forEach((listener) => listener());
};

const subscribeCaptionsSimStatus = (listener: () => void) => {
    statusListeners.add(listener);
    return () => {
        statusListeners.delete(listener);
    };
};

export const useCaptionsSimStatus = () =>
    useSyncExternalStore(subscribeCaptionsSimStatus, getCaptionsSimStatus, getCaptionsSimStatus);

export const useCaptionsSimMicrophoneUnavailable = () =>
    useSyncExternalStore(
        subscribeCaptionsSimStatus,
        getCaptionsSimMicrophoneUnavailable,
        getCaptionsSimMicrophoneUnavailable
    );

export const emitCaptionsSimEvent = (event: CaptionsSimEvent) => {
    eventListeners.forEach((listener) => listener(event));
};

export const subscribeCaptionsSimEvents = (listener: (event: CaptionsSimEvent) => void) => {
    eventListeners.add(listener);
    return () => {
        eventListeners.delete(listener);
    };
};

export const isCaptionsSimSegmentId = (id: string) => id.startsWith(CAPTIONS_SIM_ID_PREFIX);
