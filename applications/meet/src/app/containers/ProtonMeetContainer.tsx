import { useState } from 'react';

import type { ParticipantSettings } from '../types';
import { MeetContainer } from './MeetContainer';
import { ParticipantSettingsContainer } from './ParticipantSettingsContainer';

export const ProtonMeetContainer = () => {
    const [participantSettings, setParticipantSettings] = useState<ParticipantSettings | null>(null);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            {participantSettings ? (
                <MeetContainer participantSettings={participantSettings} />
            ) : (
                <ParticipantSettingsContainer onSettingsChange={setParticipantSettings} />
            )}
        </div>
    );
};
