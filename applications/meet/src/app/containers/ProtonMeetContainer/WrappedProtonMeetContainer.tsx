import { useEffect, useRef } from 'react';

import { RoomContext } from '@livekit/components-react';
import { LogLevel, Room, setLogExtension } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider';
import { audioQuality, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { ProtonMeetContainer } from './ProtonMeetContainer';

const keyProvider = new ProtonMeetKeyProvider();

const worker = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const roomRef = useRef<Room>();

    const reportMeetError = useMeetErrorReporting();

    const isLogExtensionSetup = useRef(false);

    useEffect(() => {
        if (!isLogExtensionSetup.current) {
            isLogExtensionSetup.current = true;

            setLogExtension((level, msg) => {
                if (level === LogLevel.error || level === LogLevel.warn) {
                    if (msg.includes('missing key at index')) {
                        reportMeetError(`[LiveKit] Missing key at index error detected`, {
                            level: 'error',
                        });
                    }
                }
            });
        }
    }, []);

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
