import { useState } from 'react';

import type { ParticipantSettings } from '../types';
import { MeetContainer } from './MeetContainer';
import { PrejoinContainer } from './PrejoinContainer';

export const ProtonMeetContainer = () => {
    const [participantSettings, setParticipantSettings] = useState<ParticipantSettings | null>(null);

    return (
        <div className="h-full w-full">
            {participantSettings ? (
                <MeetContainer
                    participantSettings={participantSettings}
                    setAudioDeviceId={(deviceId) =>
                        setParticipantSettings({ ...participantSettings, audioDeviceId: deviceId })
                    }
                    setVideoDeviceId={(deviceId) =>
                        setParticipantSettings({ ...participantSettings, videoDeviceId: deviceId })
                    }
                />
            ) : (
                <PrejoinContainer onSettingsChange={setParticipantSettings} />
            )}
        </div>
    );
};
