import { useRef } from 'react';

import { RoomContext } from '@livekit/components-react';
import { ExternalE2EEKeyProvider, Room } from '@proton-meet/livekit-client';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider';
import { audioQuality, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetContainer } from './ProtonMeetContainer';

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
                resolution: qualityConstants[QualityScenarios.PortraitView].resolution,
            },
            dynacast: true,
            publishDefaults: {
                simulcast: true,
                backupCodec: false,
                videoEncoding: qualityConstants[QualityScenarios.PortraitView].encoding,
                videoSimulcastLayers: [
                    qualityConstants[QualityScenarios.SmallView],
                    qualityConstants[QualityScenarios.MediumView],
                ],
                audioPreset: { maxBitrate: audioQuality },
                screenShareEncoding: screenShareQuality.encoding,
                screenShareSimulcastLayers: [],
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
