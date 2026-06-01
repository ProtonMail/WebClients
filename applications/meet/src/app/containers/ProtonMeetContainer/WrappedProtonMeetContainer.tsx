import { useEffect, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { LogLevel, Room, setLogLevel } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveAudioOutputId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';
import { isDevOrBlack } from '@proton/utils/env';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider/MediaManagementProvider';
import { SortedParticipantsProvider } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { SubscriptionManagementProvider } from '../../contexts/SubscriptionManagementProvider';
import { audioQuality, legacyQualityConstants, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { createMeetAudioContext } from '../../utils/meet-audio-context';
import { ProtonMeetContainer, ProtonMeetContainerWithUser } from './ProtonMeetContainer';

export const WrappedProtonMeetContainer = () => {
    const isGuest = useMeetSelector(selectIsGuest);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);

    const isMeetVp9Allowed = useFlag('MeetVp9');
    const isMeetHigherBitrate = useFlag('MeetHigherBitrate');
    const isMeetH264 = useFlag('MeetH264');
    const isMeetWebClientDebug = useFlag('MeetWebClientDebug');

    const isMeetEnableAudioMixing = useFlag('MeetEnableAudioMixing');
    const isMeetEnableSpatialAudio = useFlag('MeetEnableSpatialAudio');
    const isAudioMixingEnabled = isMeetEnableAudioMixing && !isMeetEnableSpatialAudio;

    const isMeetAdaptiveStream = useFlag('MeetAdaptiveStream');
    const isMeetDynacast = useFlag('MeetDynacast');
    const isMeetSimulcast = useFlag('MeetSimulcast');

    const primaryCodec = isMeetH264 ? 'h264' : 'vp8';

    const [keyProvider] = useState(() => new ProtonMeetKeyProvider());
    const [worker] = useState(() => new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)));
    const [meetAudioContext] = useState(() => createMeetAudioContext());

    const getWebAudioMix = () => {
        if (isAudioMixingEnabled) {
            return { audioContext: meetAudioContext.audioContext };
        }

        return false;
    };

    const [room] = useState(() => {
        // Log level need to be set before the room is created to work inside the livekit workers
        setLogLevel(isDevOrBlack() || isMeetWebClientDebug ? LogLevel.debug : LogLevel.info);

        return new Room({
            e2ee: {
                keyProvider,
                worker,
            },
            webAudioMix: getWebAudioMix(),
            videoCaptureDefaults: {
                resolution: isMeetHigherBitrate
                    ? qualityConstants[QualityScenarios.PortraitView].resolution
                    : legacyQualityConstants[QualityScenarios.PortraitView].resolution,
            },
            dynacast: isMeetDynacast,
            adaptiveStream: isMeetAdaptiveStream,
            publishDefaults: {
                simulcast: isMeetSimulcast,
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
        });
    });

    useEffect(() => {
        return () => {
            if (worker) {
                worker.terminate();
            }
            meetAudioContext?.cleanup();
        };
    }, [meetAudioContext, worker]);

    useEffect(() => {
        if (activeAudioOutputDeviceId) {
            meetAudioContext.setSinkId(activeAudioOutputDeviceId);
        }
    }, [activeAudioOutputDeviceId, meetAudioContext]);

    return (
        <RoomContext.Provider value={room}>
            <SubscriptionManagementProvider>
                <MediaManagementProvider>
                    <SortedParticipantsProvider>
                        {isGuest ? (
                            <ProtonMeetContainer room={room} keyProvider={keyProvider} />
                        ) : (
                            <ProtonMeetContainerWithUser room={room} keyProvider={keyProvider} />
                        )}
                    </SortedParticipantsProvider>
                </MediaManagementProvider>
            </SubscriptionManagementProvider>
        </RoomContext.Provider>
    );
};
