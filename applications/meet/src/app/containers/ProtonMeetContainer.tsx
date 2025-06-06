import { useCallback, useRef, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { Room } from 'livekit-client';

import { useQualityLevel } from '../hooks/useQualityLevel';
import { qualityConstants } from '../qualityConstants';
import { LoadingState, type ParticipantSettings, QualityScenarios } from '../types';
import { createToken } from '../utils/createToken';
import { getE2EEOptions } from '../utils/getE2EEOptions';
import { MeetContainer } from './MeetContainer';
import { PrejoinContainer } from './PrejoinContainer';

const ROOM_KEY = process.env.LIVEKIT_ROOM_KEY as string;

interface ProtonMeetContainerProps {
    guestMode?: boolean;
}

export const ProtonMeetContainer = ({ guestMode = false }: ProtonMeetContainerProps) => {
    const roomRef = useRef<Room | null>(null);

    const [participantSettings, setParticipantSettings] = useState<ParticipantSettings | null>(null);

    const [joiningInProgress, setJoiningInProgress] = useState(false);
    const [joinedRoom, setJoinedRoom] = useState(false);

    const defaultQuality = useQualityLevel();

    const defaultResolution = qualityConstants[QualityScenarios.Default][defaultQuality];

    const handleJoin = useCallback(
        async (participantSettings: ParticipantSettings) => {
            if (joiningInProgress) {
                return;
            }

            setParticipantSettings(participantSettings);
            setJoiningInProgress(true);

            try {
                const e2eeOptions = await getE2EEOptions(ROOM_KEY);

                const room = new Room({
                    ...e2eeOptions,
                    videoCaptureDefaults: {
                        resolution: defaultResolution.resolution,
                    },
                    publishDefaults: {
                        videoEncoding: defaultResolution.encoding,
                    },
                });

                const token = await createToken({
                    identity: crypto.randomUUID(),
                    room: participantSettings?.roomName as string,
                    displayName: participantSettings?.displayName as string,
                });

                await room.connect(process.env.LIVEKIT_URL as string, token);

                roomRef.current = room;

                setJoiningInProgress(false);
                setJoinedRoom(true);
            } catch (error) {
                window.alert(error);
            } finally {
                setJoiningInProgress(false);
            }
        },
        [joiningInProgress, setJoiningInProgress, participantSettings]
    );

    const handleLeave = useCallback(() => {
        void roomRef.current?.disconnect();
        setJoinedRoom(false);
    }, []);

    return (
        <div className="h-full w-full">
            {joinedRoom && roomRef.current && participantSettings ? (
                <RoomContext.Provider value={roomRef.current}>
                    <MeetContainer
                        participantSettings={participantSettings}
                        setAudioDeviceId={(deviceId) =>
                            setParticipantSettings({ ...participantSettings, audioDeviceId: deviceId })
                        }
                        setVideoDeviceId={(deviceId) =>
                            setParticipantSettings({ ...participantSettings, videoDeviceId: deviceId })
                        }
                        handleLeave={handleLeave}
                        setParticipantSettings={setParticipantSettings}
                    />
                </RoomContext.Provider>
            ) : (
                <PrejoinContainer
                    handleJoin={handleJoin}
                    loadingState={LoadingState.JoiningInProgress}
                    isLoading={joiningInProgress}
                    guestMode={guestMode}
                />
            )}
        </div>
    );
};
