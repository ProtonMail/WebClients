import { useEffect, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { LogLevel, Room, setLogExtension, setLogLevel } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider/MediaManagementProvider';
import { SortedParticipantsProvider } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { SubscriptionManagementProvider } from '../../contexts/SubscriptionManagementProvider';
import { audioQuality, legacyQualityConstants, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { isLiveKitLogAllowedToSendToSentry } from '../../utils/isLiveKitLogAllowedToSendToSentry';
import { createMeetAudioContext } from '../../utils/meet-audio-context';
import { ProtonMeetContainer, ProtonMeetContainerWithUser } from './ProtonMeetContainer';

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const { reportMeetError } = useMeetErrorReporting();

    const isMeetVp9Allowed = useFlag('MeetVp9');
    const isMeetHigherBitrate = useFlag('MeetHigherBitrate');
    const isMeetSinglePeerConnectionEnabled = useFlag('MeetSinglePeerConnection');
    const isLiveKitDebugReportingAllowed = useFlag('MeetAllowLiveKitDebugReporting');
    const isMeetH264 = useFlag('MeetH264');
    const isMeetAudioContextEnabled = useFlag('MeetAudioContextKeepalive') && isSafari();

    const primaryCodec = isMeetH264 ? 'h264' : 'vp8';

    const [keyProvider] = useState(() => new ProtonMeetKeyProvider());
    const [worker] = useState(() => new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)));
    const [meetAudioContext] = useState(() => (isMeetAudioContextEnabled ? createMeetAudioContext() : null));
    const [room] = useState(
        () =>
            new Room({
                e2ee: {
                    keyProvider,
                    worker,
                },
                webAudioMix: meetAudioContext ? { audioContext: meetAudioContext.audioContext } : false,
                videoCaptureDefaults: {
                    resolution: isMeetHigherBitrate
                        ? qualityConstants[QualityScenarios.PortraitView].resolution
                        : legacyQualityConstants[QualityScenarios.PortraitView].resolution,
                },
                dynacast: true,
                adaptiveStream: isMeetHigherBitrate,
                publishDefaults: {
                    simulcast: true,
                    backupCodec: true,
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
                    videoCodec: isMeetVp9Allowed ? 'vp9' : primaryCodec,
                    dtx: false,
                },
                disconnectOnPageLeave: false,
                singlePeerConnection: isMeetSinglePeerConnectionEnabled,
            })
    );

    useEffect(() => {
        if (isLiveKitDebugReportingAllowed) {
            setLogLevel(LogLevel.debug);

            setLogExtension((level, msg, context) => {
                if (isLiveKitLogAllowedToSendToSentry(level, msg, context)) {
                    reportMeetError(`[LiveKit][${room.name}][${room.localParticipant?.identity}] - ${msg}`, {
                        // In our case this is the ID of the room
                        room: room.name,
                        // Including the local participant identity to be able to identify the local participant compared to the others
                        localParticipant: room.localParticipant?.identity,
                        context,
                    });
                }
            });
        }
    }, []);

    useEffect(() => {
        return () => {
            if (worker) {
                worker.terminate();
            }
            meetAudioContext?.cleanup();
        };
    }, []);

    return (
        <RoomContext.Provider value={room}>
            <SubscriptionManagementProvider>
                <MediaManagementProvider>
                    <SortedParticipantsProvider>
                        {guestMode ? (
                            <ProtonMeetContainer
                                guestMode={true}
                                room={room}
                                keyProvider={keyProvider}
                                paidUser={false}
                                isSubUser={false}
                            />
                        ) : (
                            <ProtonMeetContainerWithUser guestMode={false} room={room} keyProvider={keyProvider} />
                        )}
                    </SortedParticipantsProvider>
                </MediaManagementProvider>
            </SubscriptionManagementProvider>
        </RoomContext.Provider>
    );
};
