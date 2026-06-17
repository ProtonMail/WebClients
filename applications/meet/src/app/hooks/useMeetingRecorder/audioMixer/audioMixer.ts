import type { TrackReference } from '@livekit/components-react';

import type { AudioTapSamples } from '../mediaEncoder/types';

// Delays at which we re-apply the latest audio source set. The browser
// sometimes attaches the new track to the AudioContext slightly after the
// publication switch notifies us, so reapplying once or twice shortly after
// the initial call covers the gap.
const RESYNC_DELAYS_MS = [50, 150];

// Mixes every active audio publication (mic + remote participants + screen share audio)
// into a single MediaStream destination ready to be muxed by the MediaRecorder.
//
// A silent ConstantSource is kept connected to the compressor so the output
// audio track stays alive even when every participant is muted; otherwise the
// destination stream's audio track ends and the recording loses audio for
// good after the first silence.
export class AudioMixer {
    private audioContext: AudioContext;
    private audioCompressor: DynamicsCompressorNode;
    private silentSource: ConstantSourceNode;
    private silentGain: GainNode;
    private destinationStream: MediaStream;
    private audioSourceNodes: Map<string, { source: MediaStreamAudioSourceNode; stream: MediaStream }>;
    private resyncTimers: Set<ReturnType<typeof setTimeout>> = new Set();
    private workletNode: AudioWorkletNode | null = null;
    private workletSink: GainNode | null = null;

    constructor() {
        this.audioSourceNodes = new Map();
        // 48 kHz: the AAC encoder rejects the hardware's native rate on some devices (e.g. 96 kHz).
        this.audioContext = new AudioContext({ sampleRate: 48000 });

        this.audioCompressor = this.audioContext.createDynamicsCompressor();
        this.audioCompressor.threshold.value = -24;
        this.audioCompressor.knee.value = 30;
        this.audioCompressor.ratio.value = 4;
        this.audioCompressor.attack.value = 0.003;
        this.audioCompressor.release.value = 0.25;

        const destination = this.audioContext.createMediaStreamDestination();
        this.audioCompressor.connect(destination);

        this.silentSource = this.audioContext.createConstantSource();
        this.silentSource.offset.value = 0;
        this.silentGain = this.audioContext.createGain();
        this.silentGain.gain.value = 0;
        this.silentSource.connect(this.silentGain);
        this.silentGain.connect(this.audioCompressor);
        this.silentSource.start();

        if (this.audioContext.state === 'suspended') {
            void this.audioContext.resume();
        }

        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        this.destinationStream = destination.stream;
    }

    public waitForDestinationAudioTrack(): Promise<MediaStreamTrack> {
        const existingTrack = this.destinationStream.getAudioTracks()[0];

        if (existingTrack) {
            return Promise.resolve(existingTrack);
        }

        return new Promise<MediaStreamTrack>((resolve) => {
            const handleAddTrack = (event: MediaStreamTrackEvent) => {
                if (event.track.kind === 'audio') {
                    this.destinationStream.removeEventListener('addtrack', handleAddTrack);
                    resolve(event.track);
                }
            };

            this.destinationStream.addEventListener('addtrack', handleAddTrack);
        });
    }

    private handleVisibilityChange = () => {
        if (this.audioContext.state === 'suspended') {
            void this.audioContext.resume();
        }
    };

    public updateAudioSources(audioTracks: TrackReference[]) {
        this.cancelPendingResyncs();
        this.applyAudioSources(audioTracks);

        RESYNC_DELAYS_MS.forEach((delay) => {
            const timer = setTimeout(() => {
                this.resyncTimers.delete(timer);
                this.applyAudioSources(audioTracks);
            }, delay);
            this.resyncTimers.add(timer);
        });
    }

    private cancelPendingResyncs() {
        this.resyncTimers.forEach((timer) => clearTimeout(timer));
        this.resyncTimers.clear();
    }

    private applyAudioSources(audioTracks: TrackReference[]) {
        const activeTrackIds = new Set<string>();

        audioTracks.forEach((trackRef) => {
            const track = trackRef.publication.track;

            if (track && track.mediaStreamTrack && !trackRef.publication.isMuted) {
                const trackId = track.sid || `${trackRef.participant.identity}-${trackRef.source}`;

                if (track.mediaStreamTrack.readyState === 'ended') {
                    return;
                }

                activeTrackIds.add(trackId);

                const stored = this.audioSourceNodes.get(trackId);
                const storedTrackId = stored?.stream.getAudioTracks()[0]?.id;
                const currentTrackId = track.mediaStreamTrack.id;

                if (!stored || storedTrackId !== currentTrackId) {
                    stored?.source.disconnect();

                    const stream = new MediaStream([track.mediaStreamTrack]);
                    const source = this.audioContext.createMediaStreamSource(stream);
                    source.connect(this.audioCompressor);
                    this.audioSourceNodes.set(trackId, { source, stream });
                }
            }
        });

        this.audioSourceNodes.forEach(({ source }, trackId) => {
            if (!activeTrackIds.has(trackId)) {
                source.disconnect();
                this.audioSourceNodes.delete(trackId);
            }
        });

        if (this.audioContext.state === 'suspended') {
            void this.audioContext.resume();
        }
    }

    public getAudioTracks(): MediaStreamTrack[] {
        return this.destinationStream.getAudioTracks();
    }

    // Taps the mixed audio via an AudioWorklet, a parallel branch into a muted sink,
    // so the main mix is untouched.
    public async startWorkletTap(onSamples: (samples: AudioTapSamples) => void): Promise<void> {
        await this.audioContext.audioWorklet.addModule('/assets/recording/recorderTapWorklet.js');
        this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-tap');
        this.workletNode.port.onmessage = (event: MessageEvent<AudioTapSamples>) => onSamples(event.data);
        this.workletSink = this.audioContext.createGain();
        this.workletSink.gain.value = 0;
        this.audioCompressor.connect(this.workletNode);
        this.workletNode.connect(this.workletSink);
        this.workletSink.connect(this.audioContext.destination);
    }

    public stopWorkletTap(): void {
        this.workletNode?.disconnect();
        this.workletSink?.disconnect();
        this.workletNode = null;
        this.workletSink = null;
    }

    public cleanup() {
        this.cancelPendingResyncs();
        this.stopWorkletTap();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        this.audioSourceNodes.forEach(({ source }) => {
            source.disconnect();
        });
        this.audioSourceNodes.clear();

        this.silentSource.stop();
        this.silentSource.disconnect();
        this.silentGain.disconnect();

        this.audioCompressor.disconnect();

        void this.audioContext.close();
    }
}

export const createAudioMixer = async () => {
    const audioMixer = new AudioMixer();

    await audioMixer.waitForDestinationAudioTrack();

    return audioMixer;
};
