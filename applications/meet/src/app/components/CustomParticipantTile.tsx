import type { TrackReference } from '@livekit/components-react';
import type { TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';

import { getConnectionQualityText } from '../utils/participant';

export const CustomParticipantTile = ({ track }: { track: TrackReference }) => {
    const { participant } = track;

    const audioPub = Array.from(participant.trackPublications.values()).find(
        (pub) => (pub as TrackPublication).kind === Track.Kind.Audio
    ) as TrackPublication | undefined;
    const isMuted = !!audioPub?.isMuted;

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                width: '100%',
                maxWidth: 400,
                aspectRatio: '16 / 9',
                minWidth: 320,
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <video
                    ref={(el) => {
                        if (el && track.publication?.track) {
                            track.publication.track.attach(el);
                        }
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                    muted={track.participant.isLocal}
                />
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                }}
            >
                {participant.name ?? participant.identity} {participant.isLocal ? '(You)' : ''}
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                }}
            >
                {isMuted ? 'Muted' : 'Unmuted'}
            </div>
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                }}
            >
                {getConnectionQualityText(participant.connectionQuality)}
            </div>
            {(!track.publication?.isSubscribed || track.publication?.isMuted) && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#2a2a2a',
                        color: '#ffffff',
                    }}
                >
                    {participant.name ?? participant.identity}
                </div>
            )}
        </div>
    );
};
