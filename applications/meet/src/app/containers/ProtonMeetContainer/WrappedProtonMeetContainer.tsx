import { useEffect, useRef } from 'react';

import { RoomContext } from '@livekit/components-react';
import { ExternalE2EEKeyProvider, LogLevel, Room, setLogExtension } from '@proton-meet/livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider';
import { audioQuality, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetContainer } from './ProtonMeetContainer';

const keyProvider = new ExternalE2EEKeyProvider();

const worker = new Worker(new URL('@proton-meet/livekit-client/e2ee-worker', import.meta.url));

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const roomRef = useRef<Room>();

    const reportMeetError = useMeetErrorReporting();

    const isLogExtensionSetup = useRef(false);

    // Set up logging in useEffect, not during render
    useEffect(() => {
        if (!isLogExtensionSetup.current) {
            isLogExtensionSetup.current = true;

            setLogExtension((level, msg, context) => {
                if (level === LogLevel.error) {
                    reportMeetError(`[LiveKit] ${msg}`, {
                        level: 'error',
                        extra: { context },
                    });
                } else if (level === LogLevel.warn) {
                    reportMeetError(`[LiveKit Warning] ${msg}`, {
                        level: 'warning',
                        extra: { context },
                    });
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
