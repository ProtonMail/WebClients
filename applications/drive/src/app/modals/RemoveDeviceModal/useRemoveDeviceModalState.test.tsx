import { act, renderHook, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { getDeviceName } from '@proton/drive/modules/nodes';
import useLoading from '@proton/hooks/useLoading';

import { getDeviceByUid } from '../../utils/sdk/getDeviceByUid';
import { type UseRemoveDeviceModalProps, useRemoveDeviceModalState } from './useRemoveDeviceModalState';

vi.mock('@proton/components/components/v2/useFormErrors', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mock('@proton/hooks/useLoading', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('@proton/drive/legacy/errorHandling');

vi.mock('../../utils/sdk/getDeviceByUid', () => ({
    getDeviceByUid: vi.fn(),
}));

vi.mock('@proton/drive/modules/nodes', () => ({
    getDeviceName: vi.fn(),
}));

vi.mock('@proton/drive/modules/busDriver', async () => ({
    ...(await vi.importActual('@proton/drive/modules/busDriver')),
    getBusDriver: vi.fn(),
}));

vi.mock('@proton/shared/lib/helpers/formValidators', () => ({
    requiredValidator: vi.fn((value: string) => ({ type: 'required', value })),
}));

const mockValidator = vi.fn();
const mockOnFormSubmit = vi.fn();
const mockCreateNotification = vi.fn();
const mockHandleError = vi.fn();
const mockWithSubmitting = vi.fn();
const mockEmit = vi.fn();
const mockDevice = { uid: 'device-uid' } as any;
const DEVICE_UID = 'device-uid';

describe('useRemoveDeviceModalState', () => {
    beforeEach(() => {
        vi.mocked(useFormErrors).mockReturnValue({
            validator: mockValidator,
            onFormSubmit: mockOnFormSubmit,
        } as any);

        vi.mocked(useNotifications).mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        vi.mocked(useLoading).mockReturnValue([false, mockWithSubmitting] as any);
        mockWithSubmitting.mockImplementation((promise: Promise<unknown>) => promise);

        vi.mocked(getBusDriver).mockReturnValue({
            emit: mockEmit,
        } as any);

        vi.mocked(getDeviceByUid).mockResolvedValue(mockDevice);
        vi.mocked(getDeviceName).mockReturnValue('My device');

        mockValidator.mockReturnValue(null);
        mockOnFormSubmit.mockReturnValue(true);
        mockEmit.mockResolvedValue(undefined);
        mockCreateNotification.mockClear();
        mockHandleError.mockClear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderRemoveDeviceModal = () => {
        const mockDrive = {
            deleteDevice: vi.fn().mockResolvedValue(undefined),
        };
        const onClose = vi.fn();
        const hookProps: UseRemoveDeviceModalProps = {
            deviceUid: DEVICE_UID,
            drive: mockDrive as any,
            onClose,
            open: true,
            onExit: vi.fn(),
        };

        const hook = renderHook(() => useRemoveDeviceModalState(hookProps));

        return { hook, mockDrive, onClose };
    };

    it('loads and exposes the device name for the provided uid', async () => {
        const { hook } = renderRemoveDeviceModal();

        await waitFor(() => {
            expect(hook.result.current.deviceName).toBe('My device');
        });

        expect(getDeviceByUid).toHaveBeenCalledWith(DEVICE_UID);
        expect(getDeviceName).toHaveBeenCalledWith(mockDevice);
    });

    it('submits removal when validation succeeds', async () => {
        const { hook, mockDrive, onClose } = renderRemoveDeviceModal();

        await waitFor(() => {
            expect(hook.result.current.deviceName).toBe('My device');
        });

        act(() => {
            hook.result.current.setModel({ name: 'My device' });
        });

        await act(async () => {
            await hook.result.current.handleSubmit();
        });

        expect(mockOnFormSubmit).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith(
            {
                type: BusDriverEventName.REMOVED_DEVICES,
                deviceUids: [DEVICE_UID],
            },
            mockDrive
        );
        expect(mockDrive.deleteDevice).toHaveBeenCalledWith(DEVICE_UID);
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Device removed' });
        expect(onClose).toHaveBeenCalled();
    });

    it('aborts removal when validation fails', async () => {
        mockOnFormSubmit.mockReturnValue(false);
        const { hook, mockDrive } = renderRemoveDeviceModal();

        await waitFor(() => {
            expect(hook.result.current.deviceName).toBe('My device');
        });

        await act(async () => {
            await hook.result.current.handleSubmit();
        });

        expect(mockOnFormSubmit).toHaveBeenCalled();
        expect(mockEmit).not.toHaveBeenCalled();
        expect(mockDrive.deleteDevice).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});
