import { ConnectionQuality, ConnectionState, RoomEvent, Track } from 'livekit-client';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type AudioRecoveryAPI, E2eeRecoveryManager } from './E2eeRecoveryManager';

vi.mock('@proton/shared/lib/helpers/dom', () => ({
    isDocumentVisible: () => true,
}));
vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isSafari: () => false,
}));

type EventCallback = (...args: unknown[]) => void;

interface MockReceiver {
    getStats: Mock;
}

interface MockTrack {
    mediaStreamTrack?: { id?: string; readyState?: string };
    receiver?: MockReceiver;
}

interface MockPublication {
    trackSid: string;
    kind: 'audio' | 'video';
    source: Track.Source;
    isMuted: boolean;
    isSubscribed: boolean;
    isEnabled: boolean;
    track?: MockTrack;
    setSubscribed: Mock;
    setEnabled: Mock;
}

interface MockParticipant {
    sid: string;
    identity: string;
    connectionQuality: ConnectionQuality;
    trackPublications: Map<string, MockPublication>;
    audioTrackPublications: Map<string, MockPublication>;
}

interface MockRoom {
    name: string;
    state: ConnectionState;
    localParticipant: { identity: string; connectionQuality: ConnectionQuality };
    remoteParticipants: Map<string, MockParticipant>;
    on: Mock;
    off: Mock;
    emit: (event: RoomEvent, ...args: unknown[]) => void;
}

const makeStatsReport = (entries: Record<string, any>): Map<string, any> => {
    const map = new Map<string, any>();
    Object.entries(entries).forEach(([key, value]) => map.set(key, value));
    return map;
};

const createPublication = (overrides: Partial<MockPublication> = {}): MockPublication => {
    const trackSid = overrides.trackSid ?? `track-${Math.random().toString(36).slice(2, 9)}`;
    const trackId = `media-${trackSid}`;
    const receiver: MockReceiver = { getStats: vi.fn().mockResolvedValue(new Map()) };
    return {
        trackSid,
        kind: overrides.kind ?? 'audio',
        source: overrides.source ?? Track.Source.Microphone,
        isMuted: false,
        isSubscribed: true,
        isEnabled: true,
        track: { mediaStreamTrack: { id: trackId, readyState: 'live' }, receiver },
        setSubscribed: vi.fn(function (this: MockPublication, value: boolean) {
            this.isSubscribed = value;
        }),
        setEnabled: vi.fn(function (this: MockPublication, value: boolean) {
            this.isEnabled = value;
        }),
        ...overrides,
    };
};

const createParticipant = (identity: string, publications: MockPublication[] = []): MockParticipant => {
    const trackPublications = new Map<string, MockPublication>();
    const audioTrackPublications = new Map<string, MockPublication>();
    publications.forEach((pub) => {
        trackPublications.set(pub.trackSid, pub);
        if (pub.kind === 'audio') {
            audioTrackPublications.set(pub.trackSid, pub);
        }
    });
    return {
        sid: `sid-${identity}`,
        identity,
        connectionQuality: ConnectionQuality.Excellent,
        trackPublications,
        audioTrackPublications,
    };
};

const createRoom = (): MockRoom => {
    const handlers = new Map<RoomEvent, EventCallback>();
    const room: MockRoom = {
        name: 'test-room',
        state: ConnectionState.Connected,
        localParticipant: { identity: 'local', connectionQuality: ConnectionQuality.Excellent },
        remoteParticipants: new Map(),
        on: vi.fn((event: RoomEvent, cb: EventCallback) => {
            handlers.set(event, cb);
            return room;
        }),
        off: vi.fn((event: RoomEvent) => {
            handlers.delete(event);
            return room;
        }),
        emit: (event, ...args) => handlers.get(event)?.(...args),
    };
    return room;
};

const makeAudioManagerSpy = (): AudioRecoveryAPI & { recoverTrack: Mock; isRecovering: Mock } => ({
    recoverTrack: vi.fn().mockResolvedValue(undefined),
    isRecovering: vi.fn().mockReturnValue(false),
});

const stubReceiver = (pub: MockPublication, stats: Record<string, any>) => {
    (pub.track!.receiver!.getStats as Mock).mockResolvedValue(makeStatsReport({ entry: stats }));
};

const tickOnce = async (room: MockRoom) => {
    // Advance the 2-second tick interval. Fake timers are used by callers.
    await vi.advanceTimersByTimeAsync(2_000);
    // Allow microtasks scheduled inside the async tick to settle.
    await Promise.resolve();
    void room;
};

describe('E2eeRecoveryManager', () => {
    let room: MockRoom;
    let audioManager: ReturnType<typeof makeAudioManagerSpy>;
    let manager: E2eeRecoveryManager;

    beforeEach(() => {
        vi.useFakeTimers();
        room = createRoom();
        audioManager = makeAudioManagerSpy();
        manager = new E2eeRecoveryManager({ room: room as any, audioManager });
        manager.setup();
    });

    afterEach(() => {
        manager.cleanup();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('detects video stall (pktsRx grows but framesDecoded frozen) and recovers participant', async () => {
        const videoPub = createPublication({
            trackSid: 'video-1',
            kind: 'video',
            source: Track.Source.Camera,
        });
        const audioPub = createPublication({ trackSid: 'audio-1' });
        const participant = createParticipant('p1', [videoPub, audioPub]);
        room.remoteParticipants.set('p1', participant);

        // Three consecutive ticks where pktsRx grows but framesDecoded does not.
        const sequence = [
            { packetsReceived: 100, framesDecoded: 50, kind: 'video', type: 'inbound-rtp' },
            { packetsReceived: 200, framesDecoded: 50, kind: 'video', type: 'inbound-rtp' },
            { packetsReceived: 300, framesDecoded: 50, kind: 'video', type: 'inbound-rtp' },
            { packetsReceived: 400, framesDecoded: 50, kind: 'video', type: 'inbound-rtp' },
        ];
        let i = 0;
        (videoPub.track!.receiver!.getStats as Mock).mockImplementation(async () =>
            makeStatsReport({ entry: sequence[Math.min(i++, sequence.length - 1)] })
        );
        // Audio receiver is healthy so it doesn't trigger anything on its own.
        stubReceiver(audioPub, {
            type: 'inbound-rtp',
            kind: 'audio',
            packetsReceived: 100,
            totalSamplesReceived: 0,
            totalAudioEnergy: 0,
            audioLevel: 0,
        });

        await tickOnce(room);
        await tickOnce(room);
        await tickOnce(room);
        await tickOnce(room);
        // Allow the 200ms re-subscribe scheduled inside recoverParticipant to fire.
        await vi.advanceTimersByTimeAsync(250);

        // Video gets in-place resubscribed.
        expect(videoPub.setSubscribed).toHaveBeenCalledWith(false);
        expect(videoPub.setSubscribed).toHaveBeenCalledWith(true);
        // Audio is delegated to the audio manager.
        expect(audioManager.recoverTrack).toHaveBeenCalledWith(audioPub, participant, 'video-stall');
    });

    it('detects persistent audio noise and triggers audio recovery via the audio manager', async () => {
        manager.cleanup();
        manager = new E2eeRecoveryManager({
            room: room as any,
            audioManager,
            persistentNoiseDetectionEnabled: true,
        });
        manager.setup();

        const audioPub = createPublication({ trackSid: 'audio-1' });
        const participant = createParticipant('p1', [audioPub]);
        room.remoteParticipants.set('p1', participant);

        // Calibrated to mimic the broken-cryptor signature: energyDelta/samplesDelta
        // ≈ 1.4e-5 (well above 3e-6 threshold) with audioLevel sustained ≥ 0.4.
        // Sample rate ≈ 48000 / 2s tick = 96000 samples per tick.
        // energyDelta = 96000 × 1.4e-5 = 1.344 per tick.
        let totalEnergy = 0;
        let totalSamples = 0;
        (audioPub.track!.receiver!.getStats as Mock).mockImplementation(async () => {
            // First call sets the baseline; subsequent calls grow energy persistently.
            totalSamples += 96_000;
            totalEnergy += 1.344;
            return makeStatsReport({
                entry: {
                    type: 'inbound-rtp',
                    kind: 'audio',
                    trackIdentifier: audioPub.track!.mediaStreamTrack!.id,
                    packetsReceived: totalSamples / 1000,
                    concealedSamples: 0,
                    silentConcealedSamples: 0,
                    concealmentEvents: 0,
                    totalSamplesReceived: totalSamples,
                    totalAudioEnergy: totalEnergy,
                    audioLevel: 0.6,
                },
            });
        });

        // 5 ticks: first is baseline; ticks 2-5 are 4 consecutive noise ticks.
        for (let n = 0; n < 5; n++) {
            await tickOnce(room);
        }

        expect(audioManager.recoverTrack).toHaveBeenCalledTimes(1);
        expect(audioManager.recoverTrack).toHaveBeenCalledWith(audioPub, participant, 'audio-persistent-noise');
    });

    it('skips audio recovery when the local connection quality is poor', async () => {
        manager.cleanup();
        manager = new E2eeRecoveryManager({
            room: room as any,
            audioManager,
            persistentNoiseDetectionEnabled: true,
        });
        manager.setup();

        const audioPub = createPublication({ trackSid: 'audio-1' });
        const participant = createParticipant('p1', [audioPub]);
        room.remoteParticipants.set('p1', participant);
        room.localParticipant.connectionQuality = ConnectionQuality.Poor;

        // Same broken-cryptor signature as above.
        let totalEnergy = 0;
        let totalSamples = 0;
        (audioPub.track!.receiver!.getStats as Mock).mockImplementation(async () => {
            totalSamples += 96_000;
            totalEnergy += 1.344;
            return makeStatsReport({
                entry: {
                    type: 'inbound-rtp',
                    kind: 'audio',
                    trackIdentifier: audioPub.track!.mediaStreamTrack!.id,
                    packetsReceived: totalSamples / 1000,
                    concealedSamples: 0,
                    silentConcealedSamples: 0,
                    concealmentEvents: 0,
                    totalSamplesReceived: totalSamples,
                    totalAudioEnergy: totalEnergy,
                    audioLevel: 0.6,
                },
            });
        });

        for (let n = 0; n < 5; n++) {
            await tickOnce(room);
        }

        expect(audioManager.recoverTrack).not.toHaveBeenCalled();
    });

    it('coalesces rapid EncryptionError events into a single delayed recovery', async () => {
        const audioPub = createPublication({ trackSid: 'audio-1' });
        const videoPub = createPublication({
            trackSid: 'video-1',
            kind: 'video',
            source: Track.Source.Camera,
        });
        const participant = createParticipant('p1', [audioPub, videoPub]);
        room.remoteParticipants.set('p1', participant);

        // 5 EncryptionError events within 100ms — should produce a single recovery
        // after the 1500ms debounce window.
        for (let n = 0; n < 5; n++) {
            room.emit(RoomEvent.EncryptionError, new Error('decryption failed'), participant);
            await vi.advanceTimersByTimeAsync(20);
        }

        await vi.advanceTimersByTimeAsync(2_000);

        expect(audioManager.recoverTrack).toHaveBeenCalledTimes(1);
        expect(audioManager.recoverTrack).toHaveBeenCalledWith(audioPub, participant, 'encryption-error');
    });
});
