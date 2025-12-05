import { useEffect, useRef, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { LogLevel, Room, Track, setLogExtension } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import useFlag from '@proton/unleash/useFlag';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider';
import { UIStateProvider } from '../../contexts/UIStateContext';
import { audioQuality, qualityConstants, screenShareQuality } from '../../qualityConstants';
import type { DecryptionErrorLog, KeyRotationLog } from '../../types';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { ProtonMeetContainer, ProtonMeetContainerWithUser } from './ProtonMeetContainer';

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const roomRef = useRef<Room>();

    const reportMeetError = useMeetErrorReporting();

    const isLogExtensionSetup = useRef(false);

    const keyProviderRef = useRef(new ProtonMeetKeyProvider());
    const workerRef = useRef<Worker | null>(null);

    const [keyRotationLogs, setKeyRotationLogs] = useState<KeyRotationLog[]>([]);
    const [decryptionErrorLogs, setDecryptionErrorLogs] = useState<DecryptionErrorLog[]>([]);

    const isMeetAllowDecryptionErrorReportingEnabled = useFlag('MeetAllowDecryptionErrorReporting');

    useEffect(() => {
        if (!isLogExtensionSetup.current && isMeetAllowDecryptionErrorReportingEnabled) {
            isLogExtensionSetup.current = true;

            setLogExtension((level, msg) => {
                if (level === LogLevel.error || level === LogLevel.warn) {
                    const missingKeyMatch = msg.match(/missing key at index (\d+) for participant (.+)/);
                    const [, keyIndex, participantIdentity] = missingKeyMatch ?? [];

                    const receiverIdentity = roomRef.current?.localParticipant?.identity;
                    const occupiedKeychainIndexes = keyProviderRef.current.getKeychainIndexInformation();

                    if (keyIndex === undefined || !participantIdentity || keyRotationLogs.length === 0) {
                        return;
                    }

                    const senderParticipant = roomRef.current?.remoteParticipants.get(participantIdentity);
                    const senderTracks = Array.from(senderParticipant?.trackPublications.values() ?? []);
                    const countBySource = (source: Track.Source) =>
                        senderTracks.filter((pub) => pub.source === source).length;

                    const decryptionErrorLog: DecryptionErrorLog = {
                        keyIndex: Number(keyIndex),
                        participantIdentity,
                        receiverIdentity: receiverIdentity ?? '',
                        tracksOfSender: {
                            microphone: countBySource(Track.Source.Microphone),
                            camera: countBySource(Track.Source.Camera),
                            screenShareVideo: countBySource(Track.Source.ScreenShare),
                            screenShareAudio: countBySource(Track.Source.ScreenShareAudio),
                        },
                    };

                    reportMeetError(`[LiveKit] Missing key at index error detected`, {
                        level: 'error',
                        context: {
                            occupiedKeychainIndexes,
                            keyRotationLogs,
                            ...decryptionErrorLog,
                        },
                    });

                    setDecryptionErrorLogs((prev) => [...prev, decryptionErrorLog]);
                }
            });
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
            <MediaManagementProvider>
                <UIStateProvider instantMeeting={false}>
                    {guestMode ? (
                        <ProtonMeetContainer
                            guestMode={true}
                            room={roomRef.current}
                            keyProvider={keyProviderRef.current}
                            hasSubscription={false}
                            keyRotationLogs={keyRotationLogs}
                            setKeyRotationLogs={setKeyRotationLogs}
                            decryptionErrorLogs={decryptionErrorLogs}
                        />
                    ) : (
                        <ProtonMeetContainerWithUser
                            guestMode={false}
                            room={roomRef.current}
                            keyProvider={keyProviderRef.current}
                            keyRotationLogs={keyRotationLogs}
                            setKeyRotationLogs={setKeyRotationLogs}
                            decryptionErrorLogs={decryptionErrorLogs}
                        />
                    )}
                </UIStateProvider>
            </MediaManagementProvider>
        </RoomContext.Provider>
    );
};
