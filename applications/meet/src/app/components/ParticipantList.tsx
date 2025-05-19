import React from 'react';

import { useParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { LocalTrackPublication, TrackPublication } from 'livekit-client';

import { getConnectionQualityText } from '../utils/participant';

export const ParticipantList: React.FC = () => {
    const participants = useParticipants();

    return (
        <div style={{ padding: 12, maxHeight: 600, overflow: 'auto' }}>
            <h3>Participants</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {participants.length === 0 && <li>No participants</li>}
                {participants.map((participant) => {
                    const trackPublications = [...participant.trackPublications.values()] as (
                        | TrackPublication
                        | LocalTrackPublication
                    )[];
                    // Check audio status
                    const hasAudioTrack = trackPublications.some(
                        (pub) => pub.kind === Track.Kind.Audio && !pub.isMuted
                    );
                    // Check video status (camera only)
                    const hasVideoTrack = trackPublications.some(
                        (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera && !pub.isMuted
                    );

                    return (
                        <li
                            key={participant.identity}
                            style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}
                        >
                            <div>
                                <strong>{participant.name || participant.identity}</strong>
                                {participant.isLocal && ' (You)'}
                            </div>
                            <div>Connection: {getConnectionQualityText(participant.connectionQuality)}</div>
                            <div>Audio: {hasAudioTrack ? 'Unmuted' : 'Muted'}</div>
                            <div>Video: {hasVideoTrack ? 'Video On' : 'Video Off'}</div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
