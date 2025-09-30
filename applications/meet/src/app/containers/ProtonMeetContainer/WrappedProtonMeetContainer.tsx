import { useRef } from 'react';

import { RoomContext } from '@livekit/components-react';
import { ExternalE2EEKeyProvider, Room } from '@proton-meet/livekit-client';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider';
import { qualityConstants } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetContainer } from './ProtonMeetContainer';

const defaultResolution = qualityConstants[QualityScenarios.SmallView];

const keyProvider = new ExternalE2EEKeyProvider();

const worker = new Worker(new URL('@proton-meet/livekit-client/e2ee-worker', import.meta.url));

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const roomRef = useRef<Room>();

    if (!roomRef.current) {
        roomRef.current = new Room({
            e2ee: {
                keyProvider,
                worker,
            },
            videoCaptureDefaults: {
                resolution: defaultResolution.resolution,
            },
            publishDefaults: {
                videoEncoding: defaultResolution.encoding,
            },
        });
    }

    return (
        <RoomContext.Provider value={roomRef.current}>
            <MediaManagementProvider>
                <ProtonMeetContainer guestMode={guestMode} room={roomRef.current} keyProvider={keyProvider} />
            </MediaManagementProvider>
        </RoomContext.Provider>
    );
};
