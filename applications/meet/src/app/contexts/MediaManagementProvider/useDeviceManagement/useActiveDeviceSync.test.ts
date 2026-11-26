import { renderHook, waitFor } from '@testing-library/react';
import { RoomEvent } from 'livekit-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setActiveDevice } from '@proton/meet/store/slices/deviceManagementSlice';

import { useActiveDeviceSync } from './useActiveDeviceSync';

const livekitMocks = vi.hoisted(() => ({ useRoomContext: vi.fn() }));
vi.mock('@livekit/components-react', () => livekitMocks);

const storeMocks = vi.hoisted(() => ({ dispatch: vi.fn() }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: () => storeMocks.dispatch }));

const errorReportingMocks = vi.hoisted(() => ({ reportMeetError: vi.fn() }));
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: errorReportingMocks.reportMeetError }),
}));

const device = (deviceId: string, groupId: string): MediaDeviceInfo => ({
    deviceId,
    groupId,
    kind: 'audiooutput',
    label: deviceId,
    toJSON: () => ({ deviceId, groupId, kind: 'audiooutput', label: deviceId }),
});

const WINDOWS_OUTPUTS = [
    device('default', 'headphones-group'),
    device('communications', 'headphones-group'),
    device('headphones', 'headphones-group'),
    device('speakers', 'speakers-group'),
];

const setup = ({
    outputs = WINDOWS_OUTPUTS,
    enumerateDevices = vi.fn().mockResolvedValue(outputs),
    switchActiveDevice = vi.fn().mockResolvedValue(true),
}: {
    outputs?: MediaDeviceInfo[];
    enumerateDevices?: ReturnType<typeof vi.fn>;
    switchActiveDevice?: ReturnType<typeof vi.fn>;
} = {}) => {
    const listeners = new Map<string, (kind: MediaDeviceKind, deviceId: string) => void>();
    let activeOutputId = '';
    const room = {
        on: vi.fn((event: string, listener: (kind: MediaDeviceKind, deviceId: string) => void) => {
            listeners.set(event, listener);
        }),
        off: vi.fn(),
        getActiveDevice: vi.fn((kind: MediaDeviceKind) => (kind === 'audiooutput' ? activeOutputId : undefined)),
        switchActiveDevice,
    };
    livekitMocks.useRoomContext.mockReturnValue(room);

    Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { enumerateDevices },
    });

    renderHook(() => useActiveDeviceSync());

    const emitActiveDeviceChanged = (kind: MediaDeviceKind, deviceId: string) => {
        if (kind === 'audiooutput') {
            activeOutputId = deviceId;
        }
        listeners.get(RoomEvent.ActiveDeviceChanged)?.(kind, deviceId);
    };

    return { emitActiveDeviceChanged, enumerateDevices, switchActiveDevice };
};

describe('useActiveDeviceSync', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('stores the device LiveKit made active', () => {
        const { emitActiveDeviceChanged, switchActiveDevice } = setup();

        emitActiveDeviceChanged('audiooutput', 'speakers');

        expect(storeMocks.dispatch).toHaveBeenCalledWith(
            setActiveDevice({ kind: 'audiooutput', deviceId: 'speakers' })
        );
        expect(switchActiveDevice).not.toHaveBeenCalled();
    });

    it('stores the communications alias and switches to the output behind it', async () => {
        const { emitActiveDeviceChanged, switchActiveDevice } = setup();

        emitActiveDeviceChanged('audiooutput', 'communications');

        expect(storeMocks.dispatch).toHaveBeenCalledWith(
            setActiveDevice({ kind: 'audiooutput', deviceId: 'communications' })
        );
        await waitFor(() => expect(switchActiveDevice).toHaveBeenCalledWith('audiooutput', 'headphones'));
    });

    it('does not switch when no output sits behind the communications alias', async () => {
        const { emitActiveDeviceChanged, enumerateDevices, switchActiveDevice } = setup({
            outputs: [device('default', 'headphones-group'), device('communications', 'headphones-group')],
        });

        emitActiveDeviceChanged('audiooutput', 'communications');

        await waitFor(() => expect(enumerateDevices).toHaveBeenCalled());
        await new Promise((resolve) => setTimeout(resolve));
        expect(switchActiveDevice).not.toHaveBeenCalled();
    });

    it('leaves a newer output alone when it lands while the devices are being listed', async () => {
        let resolveDevices: (devices: MediaDeviceInfo[]) => void = () => {};
        const enumerateDevices = vi.fn(
            () =>
                new Promise<MediaDeviceInfo[]>((resolve) => {
                    resolveDevices = resolve;
                })
        );
        const { emitActiveDeviceChanged, switchActiveDevice } = setup({ enumerateDevices });

        emitActiveDeviceChanged('audiooutput', 'communications');
        emitActiveDeviceChanged('audiooutput', 'speakers');
        resolveDevices(WINDOWS_OUTPUTS);
        await new Promise((resolve) => setTimeout(resolve));

        expect(enumerateDevices).toHaveBeenCalled();
        expect(switchActiveDevice).not.toHaveBeenCalled();
        expect(storeMocks.dispatch).toHaveBeenLastCalledWith(
            setActiveDevice({ kind: 'audiooutput', deviceId: 'speakers' })
        );
    });

    it('reports the failure when switching to the output behind communications fails', async () => {
        const failure = new Error('setSinkId failed');
        const { emitActiveDeviceChanged } = setup({ switchActiveDevice: vi.fn().mockRejectedValue(failure) });

        emitActiveDeviceChanged('audiooutput', 'communications');

        await waitFor(() =>
            expect(errorReportingMocks.reportMeetError).toHaveBeenCalledWith(
                'Error pinning the output behind communications',
                { context: { error: failure } }
            )
        );
    });

    it('reports the failure when listing the devices fails', async () => {
        const failure = new Error('enumerateDevices failed');
        const { emitActiveDeviceChanged, switchActiveDevice } = setup({
            enumerateDevices: vi.fn().mockRejectedValue(failure),
        });

        emitActiveDeviceChanged('audiooutput', 'communications');

        await waitFor(() =>
            expect(errorReportingMocks.reportMeetError).toHaveBeenCalledWith(
                'Error pinning the output behind communications',
                { context: { error: failure } }
            )
        );
        expect(switchActiveDevice).not.toHaveBeenCalled();
    });
});
