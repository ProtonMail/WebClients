import { useEffect, useState } from 'react';

import { RoomContext } from '@livekit/components-react';
import { LogLevel, Room, setLogLevel } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveAudioOutputId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isDevOrBlack } from '@proton/shared/lib/env';
import { useFlag } from '@proton/unleash/useFlag';

import { MeetingAnnouncerProvider } from '../../components/MeetingAnnouncer/MeetingAnnouncerContext';
import { MediaManagementProvider } from '../../contexts/MediaManagementProvider/MediaManagementProvider';
import { SortedParticipantsProvider } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { SubscriptionManagementProvider } from '../../contexts/SubscriptionManagementProvider';
import { audioQuality, legacyQualityConstants, qualityConstants, screenShareQuality } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import { createMeetAudioContext } from '../../utils/meet-audio-context';
import { MeetingAnalyticsProvider } from './MeetingAnalyticsProvider';
import { ProtonMeetContainer } from './ProtonMeetContainer';

export const WrappedProtonMeetContainer = () => {
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);

    const isMeetVp9Allowed = useFlag('MeetVp9');
    const isMeetHigherBitrate = useFlag('MeetHigherBitrate');
    const isMeetH264 = useFlag('MeetH264');
    const isMeetWebClientDebug = useFlag('MeetWebClientDebug');

    const isMeetEnableAudioMixing = useFlag('MeetEnableAudioMixing');
    const isMeetEnableSpatialAudio = useFlag('MeetEnableSpatialAudio');
    const isAudioMixingEnabled = isMeetEnableAudioMixing && !isMeetEnableSpatialAudio;

    const isMeetFixedAudioContextSampleRate = useFlag('MeetFixedAudioContextSampleRate');

    const isMeetAdaptiveStream = useFlag('MeetAdaptiveStream');
    const isMeetDynacast = useFlag('MeetDynacast');
    const isMeetSimulcast = useFlag('MeetSimulcast');

    const { reportMeetError } = useMeetErrorReporting();

    const primaryCodec = isMeetH264 ? 'h264' : 'vp8';

    const [keyProvider] = useState(() => new ProtonMeetKeyProvider());
    const [worker] = useState(() => new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)));
    const [meetAudioContext] = useState(() =>
        createMeetAudioContext({
            reportMeetError,
            sampleRate: isMeetFixedAudioContextSampleRate ? 48000 : undefined,
        })
    );

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
        <MeetingAnalyticsProvider sampleRate={meetAudioContext.audioContext.sampleRate}>
            <RoomContext.Provider value={room}>
                <SubscriptionManagementProvider>
                    <MeetingAnnouncerProvider>
                        <MediaManagementProvider>
                            <SortedParticipantsProvider>
                                <ProtonMeetContainer keyProvider={keyProvider} />
                            </SortedParticipantsProvider>
                        </MediaManagementProvider>
                    </MeetingAnnouncerProvider>
                </SubscriptionManagementProvider>
            </RoomContext.Provider>
        </MeetingAnalyticsProvider>
    );
};
