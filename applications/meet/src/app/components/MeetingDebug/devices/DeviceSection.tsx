import type { SliceDeviceState } from '@proton/meet/store/slices/deviceManagementSlice/types';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
import clsx from '@proton/utils/clsx';

import { Field } from '../Field';
import { describe, shortId } from './deviceLabels';
import type { Snapshot } from './snapshot';

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

export const DeviceSection = ({
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
                <>
                    <Field
                        name="applied processing"
                        value={snapshot.microphoneProcessing}
                        highlight={snapshot.microphoneProcessing.includes('aec:false')}
                    />
                    <Field
                        name="track readyState"
                        value={snapshot.microphoneTrackState}
                        highlight={snapshot.microphoneTrackState.includes('capture:ended')}
                    />
                </>
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
