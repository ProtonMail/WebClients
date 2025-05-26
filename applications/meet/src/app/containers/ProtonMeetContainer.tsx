import { useCallback, useRef, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { Room } from 'livekit-client';

import { getE2EEOptions } from '../setupWorker';
import { LoadingState, type ParticipantSettings } from '../types';
import { createToken } from '../utils/createToken';
import { MeetContainer } from './MeetContainer';
import { PrejoinContainer } from './PrejoinContainer';

const ROOM_KEY = process.env.LIVEKIT_ROOM_KEY as string;

export const ProtonMeetContainer = () => {
    const roomRef = useRef<Room | null>(null);

    const [participantSettings, setParticipantSettings] = useState<ParticipantSettings | null>(null);

    const [joiningInProgress, setJoiningInProgress] = useState(false);
    const [joinedRoom, setJoinedRoom] = useState(false);

    const handleJoin = useCallback(
        async (participantSettings: ParticipantSettings) => {
            if (joiningInProgress) {
                return;
            }

            setParticipantSettings(participantSettings);
            setJoiningInProgress(true);

            try {
                const e2eeOptions = await getE2EEOptions(ROOM_KEY);

                console.log(participantSettings?.isFaceTrackingEnabled);

                const room = new Room(e2eeOptions);

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
                    />
                </RoomContext.Provider>
            ) : (
                <PrejoinContainer
                    handleJoin={handleJoin}
                    loadingState={LoadingState.JoiningInProgress}
                    isLoading={joiningInProgress}
                />
            )}
        </div>
    );
};
