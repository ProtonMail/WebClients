import { useEffect, useRef, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { Track, type WebAudioSettings } from 'livekit-client';

import { Button } from '@proton/atoms/Button/Button';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
    selectCameras,
    selectMicrophoneState,
    selectMicrophones,
    selectPreferredCameraId,
    selectPreferredMicrophoneId,
    selectPreferredSpeakerId,
    selectSelectedAudioOutputId,
    selectSelectedCameraId,
    selectSelectedMicrophoneId,
    selectSpeakerState,
    selectSpeakers,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import { SECOND } from '@proton/shared/lib/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { SNAPSHOT_INTERVAL_MS } from './constants';
import { DeviceSection } from './devices/DeviceSection';
import { PlaybackSection } from './devices/PlaybackSection';
import { shortId } from './devices/deviceLabels';
import { EMPTY_SNAPSHOT, type Snapshot } from './devices/snapshot';
import { RecordingSection } from './recording/RecordingSection';

const MIN_COLUMN_SIZE = 'min(30rem, 100%)';

const SECTION_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'microphone', label: 'Microphone' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'camera', label: 'Camera' },
    { value: 'recording', label: 'Recording' },
] as const;

type SectionFilter = (typeof SECTION_FILTERS)[number]['value'];

export const MeetingDebug = () => {
    const room = useRoomContext();

    const microphones = useMeetSelector(selectMicrophones);
    const speakers = useMeetSelector(selectSpeakers);
    const cameras = useMeetSelector(selectCameras);

    const activeMicrophoneId = useMeetSelector(selectActiveMicrophoneId);
    const activeAudioOutputId = useMeetSelector(selectActiveAudioOutputId);
    const activeCameraId = useMeetSelector(selectActiveCameraId);

    const preferredMicrophoneId = useMeetSelector(selectPreferredMicrophoneId);
    const preferredSpeakerId = useMeetSelector(selectPreferredSpeakerId);
    const preferredCameraId = useMeetSelector(selectPreferredCameraId);

    const selectedMicrophoneId = useMeetSelector(selectSelectedMicrophoneId);
    const selectedAudioOutputId = useMeetSelector(selectSelectedAudioOutputId);
    const selectedCameraId = useMeetSelector(selectSelectedCameraId);

    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);

    const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
    const [filter, setFilter] = useState<SectionFilter>('all');

    const reportRef = useRef<HTMLDivElement>(null);

    const shows = (section: SectionFilter) => filter === 'all' || filter === section;

    // LiveKit, the browser and the live tracks are not reactive, and the changes that matter most
    // (the AudioContext sink and state) emit no event at all, so polling beats listening here.
    useEffect(() => {
        let isRefreshingBrowserState = false;
        let enumerated: SerializableDeviceInfo[] = [];
        let enumeratedAt = 0;
        let cameraPermissions = '(unknown)';
        let microphonePermissions = '(unknown)';

        const panelWindow = reportRef.current?.ownerDocument.defaultView ?? window;

        const refreshBrowserState = async () => {
            if (isRefreshingBrowserState) {
                return;
            }
            isRefreshingBrowserState = true;

            enumerated = await navigator.mediaDevices
                .enumerateDevices()
                .then((devices) =>
                    devices.map(({ deviceId, groupId, kind, label }) => ({ deviceId, groupId, kind, label }))
                )
                .catch(() => []);

            enumeratedAt = Date.now();

            const permissions = await Promise.all([
                navigator.permissions.query({ name: 'camera' as PermissionName }),
                navigator.permissions.query({ name: 'microphone' as PermissionName }),
            ])
                .then(([camera, microphone]) => ({
                    camera: String(camera.state),
                    microphone: String(microphone.state),
                }))
                .catch(() => ({ camera: '(unavailable)', microphone: '(unavailable)' }));

            cameraPermissions = permissions.camera;
            microphonePermissions = permissions.microphone;

            isRefreshingBrowserState = false;
        };

        const takeSnapshot = () => {
            void refreshBrowserState();

            const webAudioMix = room.options.webAudioMix;
            const audioContext =
                typeof webAudioMix === 'object' ? (webAudioMix as WebAudioSettings).audioContext : undefined;
            const contextWithSink = audioContext as (AudioContext & { sinkId?: string }) | undefined;

            const microphoneTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
            const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;

            const micSettings = microphoneTrack?.mediaStreamTrack?.getSettings() as MediaTrackSettings | undefined;
            const microphoneCaptureState = microphoneTrack?.mediaStream?.getAudioTracks()[0]?.readyState;
            const microphoneProcessedState = microphoneTrack?.getProcessor()?.processedTrack?.readyState;

            setSnapshot({
                enumerated,
                enumeratedAgo: enumeratedAt ? `${Math.round((Date.now() - enumeratedAt) / SECOND)}s ago` : '(pending)',
                cameraPermissions,
                microphonePermissions,
                livekitActive: {
                    audioinput: room.getActiveDevice('audioinput'),
                    audiooutput: room.getActiveDevice('audiooutput'),
                    videoinput: room.getActiveDevice('videoinput'),
                },
                livekitAudioOutputOption: room.options.audioOutput?.deviceId,
                canPlaybackAudio: room.canPlaybackAudio,
                webAudioMixEnabled: !!webAudioMix,
                microphoneTrackDeviceId: micSettings?.deviceId,
                microphoneProcessing: micSettings
                    ? [
                          `aec:${micSettings.echoCancellation}`,
                          `ns:${micSettings.noiseSuppression}`,
                          `agc:${micSettings.autoGainControl}`,
                          `ch:${micSettings.channelCount}`,
                      ].join(' ')
                    : '(no track)',
                microphoneTrackState: microphoneTrack
                    ? `capture:${microphoneCaptureState ?? '(none)'} processed:${microphoneProcessedState ?? '(no processor)'}`
                    : '(no track)',
                cameraTrackDeviceId: cameraTrack?.mediaStreamTrack?.getSettings().deviceId,
                audioContextState: audioContext?.state ?? '(none)',
                audioContextSampleRate: audioContext ? String(audioContext.sampleRate) : '(none)',
                audioContextSinkId:
                    contextWithSink?.sinkId === '' ? '(system default)' : shortId(contextWithSink?.sinkId),
            });
        };

        takeSnapshot();
        const interval = panelWindow.setInterval(takeSnapshot, SNAPSHOT_INTERVAL_MS);

        return () => panelWindow.clearInterval(interval);
    }, [room]);

    return (
        <div ref={reportRef} className="flex flex-column flex-nowrap gap-4 w-full">
            {isFirefox() && (
                <p className="m-0 p-3 text-sm color-warning border border-weak rounded">
                    Firefox stops delivering device changes to a window in the background. Keep the Meet window focused,
                    otherwise this panel shows stale state until you go back to it.
                </p>
            )}

            <div className="flex gap-2">
                {SECTION_FILTERS.map(({ value, label }) => (
                    <Button
                        key={value}
                        size="small"
                        shape={filter === value ? 'solid' : 'outline'}
                        onClick={() => setFilter(value)}
                        aria-pressed={filter === value}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            <div
                className="grid-auto-fill gap-4 items-start"
                style={{ '--min-grid-template-column-size': MIN_COLUMN_SIZE }}
            >
                {shows('recording') && <RecordingSection />}

                {shows('speaker') && <PlaybackSection snapshot={snapshot} />}

                {shows('camera') && (
                    <DeviceSection
                        title="Camera"
                        kind="videoinput"
                        devices={cameras}
                        snapshot={snapshot}
                        activeDeviceId={activeCameraId}
                        preferredDeviceId={preferredCameraId}
                        selectedDeviceId={selectedCameraId}
                        trackDeviceId={snapshot.cameraTrackDeviceId}
                    />
                )}

                {shows('speaker') && (
                    <DeviceSection
                        title="Speaker"
                        kind="audiooutput"
                        devices={speakers}
                        snapshot={snapshot}
                        activeDeviceId={activeAudioOutputId}
                        preferredDeviceId={preferredSpeakerId}
                        selectedDeviceId={selectedAudioOutputId}
                        deviceState={speakerState}
                    />
                )}

                {shows('microphone') && (
                    <DeviceSection
                        title="Microphone"
                        kind="audioinput"
                        devices={microphones}
                        snapshot={snapshot}
                        activeDeviceId={activeMicrophoneId}
                        preferredDeviceId={preferredMicrophoneId}
                        selectedDeviceId={selectedMicrophoneId}
                        deviceState={microphoneState}
                        trackDeviceId={snapshot.microphoneTrackDeviceId}
                    />
                )}
            </div>
        </div>
    );
};
