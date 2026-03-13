import type { RemoteParticipant, RemoteTrack, RemoteTrackPublication, Room } from 'livekit-client';
import { RemoteAudioTrack, RoomEvent, Track, TrackEvent } from 'livekit-client';

export interface SpatialAudioManagerOptions {
    /** Shared AudioContext to reuse instead of creating a new one. Pass the same context
     *  used for LiveKit's webAudioMix so the Safari keepalive covers this context too. */
    audioContext?: AudioContext;

    /** Whether spatial audio is enabled.
     * when audio mixing is not forced to be disabled and spatial audio is enabled,
     * the spatial audio will be activated.
     */
    isSpatialAudioEnabled: boolean;
    reportError?: (label: string, options?: unknown) => void;
}

interface SpatialAudioNode {
    source: MediaStreamAudioSourceNode;
    panner: StereoPannerNode;
    gain: GainNode;
    track: RemoteTrack;
    keepAliveElement?: HTMLAudioElement;
    elementAttachedListener?: () => void;
}

/**
 * SpatialAudioManager
 *
 * - Defers AudioContext creation until after a user gesture
 * - Routes remote mic audio through WebAudio
 * - Detaches LiveKit audio elements only after WebAudio is ready
 * - Keeps all participants centered
 */

export class SpatialAudioManager {
    private room: Room;
    private audioContext: AudioContext | null = null;
    private ownsAudioContext = false;
    private spatialNodes = new Map<string, SpatialAudioNode>();
    private pendingTracks = new Map<string, RemoteTrack>();
    private trackReadyListeners = new Map<string, { off: () => void }>();
    private isEnabled = true;
    private isActivated = false;
    private reportError?: (label: string, options?: unknown) => void;
    constructor(room: Room, options?: SpatialAudioManagerOptions) {
        this.room = room;
        this.isEnabled = options?.isSpatialAudioEnabled ?? true;
        this.reportError = options?.reportError;
        if (options?.audioContext) {
            this.audioContext = options.audioContext;
            this.ownsAudioContext = false;
        } else {
            this.ownsAudioContext = true;
        }
    }

    setup() {
        if (!this.isEnabled) {
            return;
        }

        try {
            this.room.on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed);
            this.room.on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed);
            this.room.on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);
            document.addEventListener('visibilitychange', this.handleVisibility);

            // activate the spatial audio
            void this.activate();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[SpatialAudio] setup failed', e);
            this.isEnabled = false;
        }
    }

    async activate() {
        // eslint-disable-next-line no-console
        console.log('[SpatialAudio] activate() called');
        if (!this.isEnabled) {
            // eslint-disable-next-line no-console
            console.log('[SpatialAudio] activate() skipped: isEnabled=false');
            return;
        }
        await this.ensureAudioContext();

        if (!this.audioContext) {
            // eslint-disable-next-line no-console
            console.log('[SpatialAudio] activate() skipped: audioContext is null');
            return;
        }

        this.isActivated = true;
        // eslint-disable-next-line no-console
        console.log('[SpatialAudio] activated', {
            isActivated: this.isActivated,
            audioContextState: this.audioContext.state,
            pendingTracks: this.pendingTracks.size,
        });

        for (const [sid, track] of this.pendingTracks.entries()) {
            this.setupTrack(track, sid);
        }

        this.pendingTracks.clear();
    }

    private async ensureAudioContext() {
        try {
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[SpatialAudio] audioContext not ready', e);
        }
    }

    private handleTrackSubscribed = (
        track: RemoteTrack,
        pub: RemoteTrackPublication,
        participant: RemoteParticipant
    ) => {
        if (!this.isEnabled) {
            return;
        }

        if (pub.kind !== Track.Kind.Audio || pub.source !== Track.Source.Microphone) {
            return;
        }

        if (participant.identity === this.room.localParticipant.identity) {
            return;
        }

        const key = pub.trackSid;

        if (!this.isActivated || !this.audioContext) {
            this.pendingTracks.set(key, track);
            return;
        }

        this.setupTrack(track, key);
    };

    private setupTrack(track: RemoteTrack, key: string) {
        const ctx = this.audioContext;
        const mediaStreamTrack = track.mediaStreamTrack;
        if (!ctx) {
            return;
        }
        const trySetup = () => {
            const currentCtx = this.audioContext;
            const currentTrack = track.mediaStreamTrack;

            if (!currentCtx || !currentTrack) {
                return;
            }

            if (currentTrack.readyState !== 'live') {
                return;
            }

            try {
                this.detachTrackReadyListener(key);
                this.cleanupNode(key);

                const stream = new MediaStream([currentTrack]);
                const source = currentCtx.createMediaStreamSource(stream);

                const panner = currentCtx.createStereoPanner();
                panner.pan.value = 0;

                const gain = currentCtx.createGain();
                gain.gain.value = 1;

                source.connect(panner);
                panner.connect(gain);
                gain.connect(currentCtx.destination);

                const node: SpatialAudioNode = {
                    source,
                    panner,
                    gain,
                    track,
                };
                this.spatialNodes.set(key, node);
                if (track instanceof RemoteAudioTrack) {
                    this.attachKeepAliveElement(track, node, key);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('[SpatialAudio] setupTrack failed', error);
                this.reportError?.('SpatialAudioManager: setupTrack failed', {
                    context: { error, trackSid: key },
                });
            }
        };

        // Remove any stale pending listener first.
        this.detachTrackReadyListener(key);

        // Most tracks are ready immediately.
        if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
            trySetup();
            return;
        }

        // Wait until media actually starts flowing.
        const onUnmuted = () => {
            this.detachTrackReadyListener(key);
            trySetup();
        };

        track.on(TrackEvent.Unmuted, onUnmuted);
        this.trackReadyListeners.set(key, {
            off: () => {
                track.off(TrackEvent.Unmuted, onUnmuted);
            },
        });
    }

    private detachTrackReadyListener(key: string) {
        const listener = this.trackReadyListeners.get(key);
        if (!listener) {
            return;
        }

        listener.off();
        this.trackReadyListeners.delete(key);
    }

    private attachKeepAliveElement(track: RemoteAudioTrack, node: SpatialAudioNode, key: string) {
        const audioEl = document.createElement('audio');
        audioEl.muted = true;
        audioEl.dataset.spatialKeepAlive = 'true';
        audioEl.autoplay = true;

        const stream = new MediaStream([track.mediaStreamTrack]);
        audioEl.srcObject = stream;
        node.keepAliveElement = audioEl;
        audioEl.play().catch((error) => {
            // eslint-disable-next-line no-console
            console.error('[SpatialAudio] audio play failed', error);
            this.reportError?.('SpatialAudioManager: audio play failed', {
                context: { error, trackSid: key },
            });
        });
        if (!node.elementAttachedListener) {
            node.elementAttachedListener = () => {
                const current = this.spatialNodes.get(key);
                if (!current || current.track !== track) {
                    return;
                }

                if (track.attachedElements.length > 0) {
                    track.detach();
                }
            };

            track.on(TrackEvent.ElementAttached, node.elementAttachedListener);
        }
    }

    private handleTrackUnsubscribed = (track: RemoteTrack, pub: RemoteTrackPublication) => {
        const key = pub.trackSid;
        this.pendingTracks.delete(key);
        this.detachTrackReadyListener(key);
        this.cleanupNode(key);
    };

    private handleParticipantDisconnected = (participant: RemoteParticipant) => {
        for (const [key, node] of this.spatialNodes.entries()) {
            if (node.track.sid && participant.trackPublications.has(node.track.sid)) {
                this.cleanupNode(key);
            }
        }
    };

    private cleanupNode(key: string) {
        const node = this.spatialNodes.get(key);
        if (!node) {
            return;
        }

        try {
            if (node.elementAttachedListener && node.track instanceof RemoteAudioTrack) {
                node.track.off(TrackEvent.ElementAttached, node.elementAttachedListener);
            }

            node.source.disconnect();
            node.panner.disconnect();
            node.gain.disconnect();

            if (node.keepAliveElement) {
                node.keepAliveElement.srcObject = null;
            }
        } catch {}

        this.spatialNodes.delete(key);
    }

    private handleVisibility = () => {
        if (!this.audioContext) {
            return;
        }

        if (document.visibilityState !== 'visible') {
            return;
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }
    };

    cleanup() {
        this.room.off(RoomEvent.TrackSubscribed, this.handleTrackSubscribed);
        this.room.off(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed);
        this.room.off(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected);

        document.removeEventListener('visibilitychange', this.handleVisibility);

        this.pendingTracks.clear();
        for (const key of this.trackReadyListeners.keys()) {
            this.detachTrackReadyListener(key);
        }

        for (const key of this.spatialNodes.keys()) {
            this.cleanupNode(key);
        }

        if (this.audioContext && this.ownsAudioContext) {
            void this.audioContext.close();
        }

        this.audioContext = null;
        this.isActivated = false;
    }
}
