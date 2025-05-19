import type { LocalVideoTrack, VideoQuality } from 'livekit-client';

import { useE2EE } from '../hooks/useE2EE';
import { useFaceTrackingPublisher } from '../hooks/useFaceTrackingPublisher';
import { ParticipantControls } from './ParticipantControls';
import { ParticipantGrid } from './ParticipantGrid';
import { ParticipantList } from './ParticipantList';

interface MeetingBodyProps {
    quality: VideoQuality;
    setQuality: (quality: VideoQuality) => void;
    isFaceTrackingEnabled: boolean;
    faceTrack: LocalVideoTrack | null;
}

export const MeetingBody = ({ quality, setQuality, isFaceTrackingEnabled, faceTrack }: MeetingBodyProps) => {
    useE2EE();
    useFaceTrackingPublisher({ faceTrack, isFaceTrackingEnabled });

    return (
        <div style={{ display: 'flex', gap: 10 }}>
            <div>
                <div style={{ width: '100%', height: 'calc(100% - 60px)', overflow: 'hidden' }}>
                    <ParticipantGrid maxGridSize={3} quality={quality} />
                </div>
                <div style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center' }}>
                    <ParticipantControls quality={quality} onQualityChange={setQuality} />
                </div>
            </div>
            <ParticipantList />
        </div>
    );
};
