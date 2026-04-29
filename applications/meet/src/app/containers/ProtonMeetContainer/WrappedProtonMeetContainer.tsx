import { useEffect, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import { LogLevel, Room, setLogExtension, setLogLevel } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useFlag } from '@proton/unleash/useFlag';

import { useGuestContext } from '../../contexts/GuestProvider/GuestContext';
import { MediaManagementProvider } from '../../contexts/MediaManagementProvider/MediaManagementProvider';
import { SortedParticipantsProvider } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { SubscriptionManagementProvider } from '../../contexts/SubscriptionManagementProvider';
import { audioQuality, legacyQualityConstants, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { isLiveKitLogAllowedToSendToSentry } from '../../utils/isLiveKitLogAllowedToSendToSentry';
import { createMeetAudioContext } from '../../utils/meet-audio-context';
import { ProtonMeetContainer, ProtonMeetContainerWithUser } from './ProtonMeetContainer';

export const WrappedProtonMeetContainer = () => {
    const { reportMeetError } = useMeetErrorReporting();
    const isGuest = useGuestContext();

    const isMeetVp9Allowed = useFlag('MeetVp9');
    const isMeetHigherBitrate = useFlag('MeetHigherBitrate');
    const isLiveKitDebugReportingAllowed = useFlag('MeetAllowLiveKitDebugReporting');
    const isMeetH264 = useFlag('MeetH264');

    const isMeetEnableAudioMixing = useFlag('MeetEnableAudioMixing');
    const isMeetEnableSpatialAudio = useFlag('MeetEnableSpatialAudio');
    const isAudioMixingEnabled = isMeetEnableAudioMixing && !isMeetEnableSpatialAudio;

    const primaryCodec = isMeetH264 ? 'h264' : 'vp8';

    const [keyProvider] = useState(() => new ProtonMeetKeyProvider());
    const [worker] = useState(() => new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)));
    const [meetAudioContext] = useState(() => createMeetAudioContext());
    // Isolated AudioContext for Krisp's AudioWorklet. LiveKit's acquireAudioContext() sets the
    // same shared context on both remote tracks and localParticipant, which puts Krisp's processing
    // graph in the same AudioContext as all remote audio nodes. Under reconnection this creates a
    // loopback where remote audio leaks into Krisp's output and gets re-broadcast to everyone.
    const [krispAudioContext] = useState(() => (isKrispNoiseFilterSupported() ? new AudioContext() : undefined));
    const [room] = useState(
        () =>
            new Room({
                e2ee: {
                    keyProvider,
                    worker,
                },
                webAudioMix: isAudioMixingEnabled ? { audioContext: meetAudioContext.audioContext } : false,
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
                        tags: room.name ? { meetingLinkName: room.name } : undefined,
                    });
                }
            });
        }
    }, []);

    useEffect(() => {
        // Resume the Krisp context in the same user-gesture window as the main context.
        // Defined here (not inside the useState factory) so it can be properly removed on unmount.
        const onMeetContextStateChange = () => {
            if (meetAudioContext.audioContext.state === 'running') {
                krispAudioContext?.resume().catch(() => {});
            }
        };
        if (krispAudioContext) {
            meetAudioContext.audioContext.addEventListener('statechange', onMeetContextStateChange);
        }

        return () => {
            if (krispAudioContext) {
                meetAudioContext.audioContext.removeEventListener('statechange', onMeetContextStateChange);
            }
            if (worker) {
                worker.terminate();
            }
            meetAudioContext?.cleanup();
            krispAudioContext?.close().catch(() => {});
        };
    }, []);

    return (
        <RoomContext.Provider value={room}>
            <SubscriptionManagementProvider>
                <MediaManagementProvider krispAudioContext={krispAudioContext}>
                    <SortedParticipantsProvider>
                        {isGuest ? (
                            <ProtonMeetContainer
                                room={room}
                                keyProvider={keyProvider}
                                paidUser={false}
                                isSubUser={false}
                            />
                        ) : (
                            <ProtonMeetContainerWithUser room={room} keyProvider={keyProvider} />
                        )}
                    </SortedParticipantsProvider>
                </MediaManagementProvider>
            </SubscriptionManagementProvider>
        </RoomContext.Provider>
    );
};
