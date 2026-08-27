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
import type { SliceDeviceState } from '@proton/meet/store/slices/deviceManagementSlice/types';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import { SECOND } from '@proton/shared/lib/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

const SNAPSHOT_INTERVAL_MS = SECOND;

const MIN_COLUMN_SIZE = 'min(30rem, 100%)';

const DEVICE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'microphone', label: 'Microphone' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'camera', label: 'Camera' },
] as const;

type DeviceFilter = (typeof DEVICE_FILTERS)[number]['value'];

const shortId = (deviceId: string | null | undefined) => {
    if (deviceId === undefined) {
        return '(undefined)';
    }
    if (deviceId === null) {
        return '(null)';
    }
    if (deviceId === '') {
        return '(empty)';
    }
    if (deviceId === 'default') {
        return 'default';
    }
    return deviceId.slice(0, 8);
};

const labelFor = (devices: SerializableDeviceInfo[], deviceId: string | null | undefined) =>
    devices.find((device) => device.deviceId === deviceId)?.label ?? '(not in list)';

const describe = (devices: SerializableDeviceInfo[], deviceId: string | null | undefined) =>
    `${shortId(deviceId)} · ${labelFor(devices, deviceId)}`;

interface Snapshot {
    enumerated: SerializableDeviceInfo[];
    enumeratedAgo: string;
    livekitActive: Partial<Record<MediaDeviceKind, string | undefined>>;
    livekitAudioOutputOption: string | undefined;
    canPlaybackAudio: boolean;
    webAudioMixEnabled: boolean;
    microphoneTrackDeviceId: string | undefined;
    microphoneProcessing: string;
    cameraTrackDeviceId: string | undefined;
    audioContextState: string;
    audioContextSampleRate: string;
    audioContextSinkId: string;
    cameraPermissions: string;
    microphonePermissions: string;
}

const EMPTY_SNAPSHOT: Snapshot = {
    enumerated: [],
    enumeratedAgo: '(pending)',
    livekitActive: {},
    livekitAudioOutputOption: undefined,
    canPlaybackAudio: false,
    webAudioMixEnabled: false,
    microphoneTrackDeviceId: undefined,
    microphoneProcessing: '(none)',
    cameraTrackDeviceId: undefined,
    audioContextState: '(none)',
    audioContextSampleRate: '(none)',
    audioContextSinkId: '(none)',
    cameraPermissions: '(unknown)',
    microphonePermissions: '(unknown)',
};

const Field = ({ name, value, highlight = false }: { name: string; value: string; highlight?: boolean }) => (
    <div className="flex flex-nowrap gap-2 text-sm">
        <span className="color-weak shrink-0 min-w-custom" style={{ '--min-w-custom': '9.5rem' }}>
            {name}
        </span>
        <span className={clsx('flex-1 min-w-0 text-break', highlight && 'color-danger text-bold')}>{value}</span>
    </div>
);

const DeviceList = ({
    title,
    devices,
    activeDeviceId,
    updatedAgo,
}: {
    title: string;
    devices: SerializableDeviceInfo[];
    activeDeviceId: string | null;
    updatedAgo?: string;
}) => (
    <div className="flex flex-column gap-1 mt-2">
        <span className="color-weak text-sm">
            {`${title} (${devices.length})${updatedAgo ? ` · ${updatedAgo}` : ''}`}
        </span>
        {devices.map((device, index) => (
            <div
                key={`${device.deviceId}-${index}`}
                className={clsx('text-sm text-break', device.deviceId === activeDeviceId && 'text-bold color-primary')}
            >
                {`[${index}] ${device.label || '(no label)'} · id=${shortId(device.deviceId)} · group=${shortId(device.groupId)}`}
            </div>
        ))}
    </div>
);

interface DeviceSectionProps {
    title: string;
    kind: MediaDeviceKind;
    devices: SerializableDeviceInfo[];
    snapshot: Snapshot;
    activeDeviceId: string | null;
    preferredDeviceId: string | null;
    selectedDeviceId: string | null;
    deviceState?: SliceDeviceState;
    trackDeviceId?: string | undefined;
}

const DeviceSection = ({
    title,
    kind,
    devices,
    snapshot,
    activeDeviceId,
    preferredDeviceId,
    selectedDeviceId,
    deviceState,
    trackDeviceId,
}: DeviceSectionProps) => {
    const livekitActiveDeviceId = snapshot.livekitActive[kind];
    const enumeratedForKind = snapshot.enumerated.filter((device) => device.kind === kind);

    return (
        <section className="flex flex-column gap-2 w-full border border-weak rounded p-3">
            <h3 className="text-bold text-sm m-0">{title}</h3>

            <Field name="active (redux)" value={describe(devices, activeDeviceId)} />
            <Field
                name="active (livekit)"
                value={describe(devices, livekitActiveDeviceId)}
                highlight={livekitActiveDeviceId !== undefined && livekitActiveDeviceId !== activeDeviceId}
            />
            {trackDeviceId !== undefined && (
                <Field
                    name="capturing (track)"
                    value={describe(devices, trackDeviceId)}
                    highlight={trackDeviceId !== activeDeviceId}
                />
            )}
            {kind === 'audiooutput' && (
                <Field
                    name="livekit audioOutput"
                    value={describe(devices, snapshot.livekitAudioOutputOption)}
                    highlight={snapshot.livekitAudioOutputOption === undefined}
                />
            )}
            {kind === 'audioinput' && (
                <Field
                    name="applied processing"
                    value={snapshot.microphoneProcessing}
                    highlight={snapshot.microphoneProcessing.includes('aec:false')}
                />
            )}

            <Field name="preferred" value={describe(devices, preferredDeviceId)} />
            <Field
                name="selected (picker)"
                value={describe(devices, selectedDeviceId)}
                highlight={selectedDeviceId !== activeDeviceId}
            />

            {deviceState && (
                <>
                    <Field
                        name="systemDefault"
                        value={
                            deviceState.systemDefault
                                ? `${shortId(deviceState.systemDefault.deviceId)} · ${deviceState.systemDefault.label}`
                                : '(unresolved)'
                        }
                        highlight={!deviceState.systemDefault}
                    />
                    <Field name="systemDefaultLabel" value={deviceState.systemDefaultLabel} />
                    <Field name="useSystemDefault" value={String(deviceState.useSystemDefault)} />
                    <Field name="preferredAvailable" value={String(deviceState.preferredAvailable)} />
                    <Field name="hasDefaultOption" value={String(deviceState.hasDefaultOption)} />
                </>
            )}

            <DeviceList title="redux list (store order)" devices={devices} activeDeviceId={activeDeviceId} />
            <DeviceList
                title="browser enumerateDevices"
                devices={enumeratedForKind}
                activeDeviceId={activeDeviceId}
                updatedAgo={snapshot.enumeratedAgo}
            />
        </section>
    );
};

export const DeviceStateReport = () => {
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
    const [filter, setFilter] = useState<DeviceFilter>('all');

    const reportRef = useRef<HTMLDivElement>(null);

    const shows = (section: DeviceFilter) => filter === 'all' || filter === section;

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
                {DEVICE_FILTERS.map(({ value, label }) => (
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
                {shows('speaker') && (
                    <section className="flex flex-column gap-2 w-full border border-weak rounded p-3">
                        <h3 className="text-bold text-sm m-0">Playback</h3>
                        <Field name="webAudioMix" value={String(snapshot.webAudioMixEnabled)} />
                        <Field
                            name="canPlaybackAudio"
                            value={String(snapshot.canPlaybackAudio)}
                            highlight={!snapshot.canPlaybackAudio}
                        />
                        <Field
                            name="audioContext.state"
                            value={snapshot.audioContextState}
                            highlight={
                                snapshot.audioContextState === 'suspended' || snapshot.audioContextState === 'closed'
                            }
                        />
                        <Field name="audioContext.sampleRate" value={snapshot.audioContextSampleRate} />
                        <Field name="audioContext.sinkId" value={snapshot.audioContextSinkId} />
                        <Field name="cameraPermissions" value={snapshot.cameraPermissions} />
                        <Field name="microphonePermissions" value={snapshot.microphonePermissions} />
                    </section>
                )}

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
