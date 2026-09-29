import type { Room, WebAudioSettings } from 'livekit-client';
import { Track } from 'livekit-client';

/** Debug helpers for reproducing and inspecting a de-synced audio output pin. */

/** An id no enumeration returns, so `setSinkId` rejects and the pin fails. */
export const MISSING_OUTPUT_DEVICE_ID = 'debug-missing-audio-output-device';

type AudioContextWithSinkId = AudioContext & {
    sinkId?: string | { type: string };
    setSinkId?: (sinkId: string) => Promise<void>;
};

type MediaElementWithSinkId = HTMLMediaElement & { sinkId?: string };

const getPlaybackContext = (room: Room): AudioContextWithSinkId | undefined => {
    const { webAudioMix } = room.options;

    if (typeof webAudioMix !== 'object') {
        return undefined;
    }

    return (webAudioMix as WebAudioSettings).audioContext as AudioContextWithSinkId | undefined;
};

const getRemoteAudioElements = (room: Room) => {
    const elements: MediaElementWithSinkId[] = [];

    for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.audioTrackPublications.values()) {
            if (publication.source !== Track.Source.Microphone || !publication.track) {
                continue;
            }

            elements.push(...(publication.track.attachedElements as MediaElementWithSinkId[]));
        }
    }

    return elements;
};

export interface AudioOutputState {
    livekitActiveDevice: string | undefined;
    livekitAudioOutputOption: string | undefined;
    audioContextSinkId: string | { type: string } | undefined;
    remoteElementSinkIds: (string | undefined)[];
}

/** Everything the app can disagree with itself about, in one place. */
export const readAudioOutputState = (room: Room): AudioOutputState => ({
    livekitActiveDevice: room.getActiveDevice('audiooutput'),
    livekitAudioOutputOption: room.options.audioOutput?.deviceId,
    audioContextSinkId: getPlaybackContext(room)?.sinkId,
    remoteElementSinkIds: getRemoteAudioElements(room).map((element) => element.sinkId),
});

/** Replays the `error` Chrome fires when the rendered device disappears, without unplugging it. */
export const simulateOutputDeviceLoss = (room: Room) => {
    const context = getPlaybackContext(room);

    if (!context) {
        // eslint-disable-next-line no-console
        console.warn('[audioOutputDebug] no playback context, is webAudioMix enabled?');
        return;
    }

    context.dispatchEvent(new Event('error'));

    // eslint-disable-next-line no-console
    console.warn('[audioOutputDebug] dispatched error on the playback context', readAudioOutputState(room));
};

/** Drops every output pin without touching the store, so the app still believes it is applied. */
export const desyncAudioOutput = async (room: Room) => {
    const before = readAudioOutputState(room);

    room.localParticipant.activeDeviceMap.delete('audiooutput');

    if (room.options.audioOutput) {
        room.options.audioOutput.deviceId = undefined;
    }

    await Promise.all(
        [...room.remoteParticipants.values()].map((participant) =>
            participant.setAudioOutput({ deviceId: '' }).catch(() => {})
        )
    );

    // eslint-disable-next-line no-console
    console.warn('[audioOutputDebug] desynced', { before, after: readAudioOutputState(room) });
};
