import { useEffect, useRef } from 'react';

import { RoomContext } from '@livekit/components-react';
import { LogLevel, Room, setLogExtension } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider';
import { UIStateProvider } from '../../contexts/UIStateContext';
import { audioQuality, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { ProtonMeetContainer, ProtonMeetContainerWithUser } from './ProtonMeetContainer';

const worker = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const roomRef = useRef<Room>();

    const reportMeetError = useMeetErrorReporting();

    const isLogExtensionSetup = useRef(false);

    const keyProviderRef = useRef(new ProtonMeetKeyProvider());

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
                keyProvider: keyProviderRef.current,
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
            disconnectOnPageLeave: false,
        });
    }

    return (
        <RoomContext.Provider value={roomRef.current}>
            <MediaManagementProvider>
                <UIStateProvider instantMeeting={false}>
                    {guestMode ? (
                        <ProtonMeetContainer
                            guestMode={true}
                            room={roomRef.current}
                            keyProvider={keyProviderRef.current}
                            hasSubscription={false}
                        />
                    ) : (
                        <ProtonMeetContainerWithUser
                            guestMode={false}
                            room={roomRef.current}
                            keyProvider={keyProviderRef.current}
                        />
                    )}
                </UIStateProvider>
            </MediaManagementProvider>
        </RoomContext.Provider>
    );
};
