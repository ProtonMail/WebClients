import { isSafari } from '@proton/shared/lib/helpers/browser';

/**
 * Creates an AudioContext for use with LiveKit's webAudioMix option.
 *
 * Passing a custom AudioContext to LiveKit (via webAudioMix: { audioContext }) gives
 * a single shared reference that can be used to create PannerNodes or other WebAudio
 * nodes for spatial audio, on all platforms.
 *
 * On Safari, a keepalive is attached to prevent background tab throttling: a silent
 * looping source is routed through a MediaStreamDestinationNode into an <audio> element.
 * This makes Safari classify the tab as actively playing media, preventing it from
 * throttling the AudioContext and the WebRTC pipeline in background/inactive tabs —
 * which would otherwise cause gradual audio loss after several minutes.
 */
export const createMeetAudioContext = (): { audioContext: AudioContext; cleanup: () => void } => {
    const audioContext = new AudioContext();

    // setSinkId is supported in Chrome 110+ but not yet in the TypeScript lib types.
    const ctx = audioContext as AudioContext & { setSinkId?: (sinkId: string) => Promise<void> };

    // When an output device is disconnected (e.g. a USB speaker unplugged), Chrome fires
    // an 'error' event on the AudioContext. Reset the sinkId to the system default so
    // audio re-routes to the fallback device without requiring a page refresh.
    const onAudioContextError = () => {
        ctx.setSinkId?.('').catch(() => {});
    };
    audioContext.addEventListener('error', onAudioContextError);

    if (!isSafari()) {
        return {
            audioContext,
            cleanup: () => {
                audioContext.removeEventListener('error', onAudioContextError);
                audioContext.close().catch(() => {});
            },
        };
    }

    // Safari only: anchor the AudioContext to an <audio> element so Safari treats
    // the tab as an active media session and backs off from background throttling.
    // volume=0 (not muted) is intentional: muted elements may not register as active.
    const silentBuffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
    const source = audioContext.createBufferSource();
    source.buffer = silentBuffer;
    source.loop = true;

    const dest = audioContext.createMediaStreamDestination();
    source.connect(dest);
    source.start();

    const keepAliveAudio = document.createElement('audio');
    keepAliveAudio.srcObject = dest.stream;
    keepAliveAudio.volume = 0;

    // AudioContext starts suspended due to browser autoplay policy. LiveKit calls audioContext.resume()
    // when attaching the first remote audio track, which happens after the user has joined the call.
    // We listen for that state change to start the keepalive.
    const onStateChange = () => {
        if (audioContext.state === 'running') {
            keepAliveAudio.play().catch(() => {});
            audioContext.removeEventListener('statechange', onStateChange);
        }
    };
    audioContext.addEventListener('statechange', onStateChange);

    return {
        audioContext,
        cleanup: () => {
            audioContext.removeEventListener('error', onAudioContextError);
            audioContext.removeEventListener('statechange', onStateChange);
            source.stop();
            source.disconnect();
            dest.disconnect();
            keepAliveAudio.pause();
            keepAliveAudio.srcObject = null;
            audioContext.close().catch(() => {});
        },
    };
};
