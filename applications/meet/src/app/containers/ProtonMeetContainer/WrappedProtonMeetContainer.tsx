import { useEffect, useRef, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { LogLevel, Room, setLogLevel } from 'livekit-client';

import useFlag from '@proton/unleash/useFlag';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider/MediaManagementProvider';
import { SortedParticipantsProvider } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { SubscriptionManagementProvider } from '../../contexts/SubscriptionManagementProvider';
import { audioQuality, legacyQualityConstants, qualityConstants, screenShareQuality } from '../../qualityConstants';
import type { KeyRotationLog } from '../../types';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { ProtonMeetContainer, ProtonMeetContainerWithUser } from './ProtonMeetContainer';

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const roomRef = useRef<Room>();

    const isLogExtensionSetup = useRef(false);

    const keyProviderRef = useRef(new ProtonMeetKeyProvider());
    const workerRef = useRef<Worker | null>(null);

    const [keyRotationLogs, setKeyRotationLogs] = useState<KeyRotationLog[]>([]);

    const isMeetVp9Allowed = useFlag('MeetVp9');
    const isMeetHigherBitrate = useFlag('MeetHigherBitrate');
    const isMeetSinglePeerConnectionEnabled = useFlag('MeetSinglePeerConnection');
    const isLiveKitDebugReportingAllowed = useFlag('MeetAllowLiveKitDebugReporting');

    useEffect(() => {
        if (!isLogExtensionSetup.current && isLiveKitDebugReportingAllowed) {
            isLogExtensionSetup.current = true;

            setLogLevel(LogLevel.debug);
        }
    }, []);

    if (!roomRef.current) {
        workerRef.current = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
        roomRef.current = new Room({
            e2ee: {
                keyProvider: keyProviderRef.current,
                worker: workerRef.current,
            },
            videoCaptureDefaults: {
                resolution: isMeetHigherBitrate
                    ? qualityConstants[QualityScenarios.PortraitView].resolution
                    : legacyQualityConstants[QualityScenarios.PortraitView].resolution,
            },
            dynacast: true,
            adaptiveStream: isMeetHigherBitrate,
            publishDefaults: {
                simulcast: true,
                backupCodec: isMeetVp9Allowed,
                degradationPreference: 'maintain-framerate',
                videoEncoding: {
                    ...(isMeetHigherBitrate
                        ? qualityConstants[QualityScenarios.PortraitView].encoding
                        : legacyQualityConstants[QualityScenarios.PortraitView].encoding),
                    priority: 'medium',
                },
                videoSimulcastLayers: [
                    isMeetHigherBitrate
                        ? qualityConstants[QualityScenarios.SmallView]
                        : legacyQualityConstants[QualityScenarios.SmallView],
                    isMeetHigherBitrate
                        ? qualityConstants[QualityScenarios.MediumView]
                        : legacyQualityConstants[QualityScenarios.MediumView],
                ],
                audioPreset: { maxBitrate: audioQuality, priority: 'high' },
                screenShareEncoding: screenShareQuality.encoding,
                screenShareSimulcastLayers: [],
                videoCodec: isMeetVp9Allowed ? 'vp9' : 'vp8',
            },
            disconnectOnPageLeave: false,
            singlePeerConnection: isMeetSinglePeerConnectionEnabled,
        });
    }

    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    return (
        <RoomContext.Provider value={roomRef.current}>
            <SubscriptionManagementProvider>
                <MediaManagementProvider>
                    <SortedParticipantsProvider>
                        {guestMode ? (
                            <ProtonMeetContainer
                                guestMode={true}
                                room={roomRef.current}
                                keyProvider={keyProviderRef.current}
                                paidUser={false}
                                keyRotationLogs={keyRotationLogs}
                                setKeyRotationLogs={setKeyRotationLogs}
                            />
                        ) : (
                            <ProtonMeetContainerWithUser
                                guestMode={false}
                                room={roomRef.current}
                                keyProvider={keyProviderRef.current}
                                keyRotationLogs={keyRotationLogs}
                                setKeyRotationLogs={setKeyRotationLogs}
                            />
                        )}
                    </SortedParticipantsProvider>
                </MediaManagementProvider>
            </SubscriptionManagementProvider>
        </RoomContext.Provider>
    );
};
