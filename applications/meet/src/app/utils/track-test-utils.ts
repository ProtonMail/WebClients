import { RemoteParticipant, RemoteTrackPublication, Track, VideoQuality } from 'livekit-client';

export const defineWritable = (obj: any, key: string, value: any) => {
    Object.defineProperty(obj, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
    });
};

export const createPublication = (
    trackSid: string,
    source: Track.Source,
    overrides: Partial<Record<string, any>> = {}
) => {
    const pub = Object.create(RemoteTrackPublication.prototype) as any;

    defineWritable(pub, 'source', source);
    defineWritable(pub, 'trackSid', trackSid);
    defineWritable(pub, 'isSubscribed', false);
    defineWritable(pub, 'isEnabled', false);
    defineWritable(pub, 'track', undefined);
    defineWritable(pub, 'isMuted', false);

    pub.setSubscribed = (value: boolean) => {
        pub.isSubscribed = value;
    };
    pub.setEnabled = (value: boolean) => {
        pub.isEnabled = value;
    };

    Object.assign(pub, overrides);
    return pub as RemoteTrackPublication;
};

export const createCameraPublication = (trackSid: string, overrides: Partial<Record<string, any>> = {}) => {
    // Separate videoQuality from other overrides to handle it specially
    const { videoQuality, ...otherOverrides } = overrides;

    const pub = createPublication(trackSid, Track.Source.Camera, otherOverrides);

    // Add camera-specific properties
    defineWritable(pub, 'videoQuality', videoQuality ?? VideoQuality.HIGH);
    pub.setVideoQuality = (quality: any) => {
        (pub as any).videoQuality = quality;
    };

    return pub;
};

export const createAudioPublication = (trackSid: string, overrides: Partial<Record<string, any>> = {}) => {
    return createPublication(trackSid, Track.Source.Microphone, overrides);
};

export const createMockParticipant = (identity: string) => {
    const participant = Object.create(RemoteParticipant.prototype) as any;
    defineWritable(participant, 'identity', identity);
    return participant as RemoteParticipant;
};
