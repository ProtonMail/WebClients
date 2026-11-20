import { act, renderHook, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { getDeviceName } from '@proton/drive/modules/nodes';
import useLoading from '@proton/hooks/useLoading';

import { getDeviceByUid } from '../../utils/sdk/getDeviceByUid';
import { type UseRenameDeviceModalProps, useRenameDeviceModalState } from './useRenameDeviceModalState';

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

vi.mock('@proton/drive/legacy/errorHandling', () => ({
    handleSdkError: vi.fn(),
}));

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

const DEVICE_UID = 'device-uid';
const mockDevice = { uid: DEVICE_UID } as any;

describe('useRenameDeviceModalState', () => {
    beforeEach(() => {
        vi.mocked(useFormErrors).mockReturnValue({
            validator: mockValidator,
            onFormSubmit: mockOnFormSubmit,
        } as any);

        vi.mocked(useNotifications).mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        vi.mocked(useLoading).mockReturnValue([false, mockWithSubmitting] as any);

        vi.mocked(getBusDriver).mockReturnValue({
            emit: mockEmit,
        } as any);

        vi.mocked(getDeviceByUid).mockResolvedValue(mockDevice);
        vi.mocked(getDeviceName).mockReturnValue('My laptop');

        mockValidator.mockReturnValue(null);
        mockOnFormSubmit.mockReturnValue(true);
        mockWithSubmitting.mockImplementation((promise: Promise<unknown>) => promise);
        mockEmit.mockResolvedValue(undefined);
        mockCreateNotification.mockClear();
        mockHandleError.mockClear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderUseRenameDeviceModalState = () => {
        const mockDrive = {
            renameDevice: vi.fn().mockResolvedValue(undefined),
        };
        const onClose = vi.fn();
        const hookProps = {
            deviceUid: DEVICE_UID,
            drive: mockDrive as any,
            onClose,
            open: true,
            onExit: vi.fn(),
        } as UseRenameDeviceModalProps;

        const hook = renderHook(() => useRenameDeviceModalState(hookProps));

        return { hook, mockDrive, onClose };
    };

    it('loads and exposes the device name for the given uid', async () => {
        const { hook } = renderUseRenameDeviceModalState();

        await waitFor(() => {
            expect(hook.result.current.deviceName).toBe('My laptop');
        });

        expect(getDeviceByUid).toHaveBeenCalledWith(DEVICE_UID);
        expect(getDeviceName).toHaveBeenCalledWith(mockDevice);
    });

    it('renames the device when the form submission is valid', async () => {
        const { hook, mockDrive, onClose } = renderUseRenameDeviceModalState();

        await waitFor(() => {
            expect(hook.result.current.deviceName).toBe('My laptop');
        });

        act(() => {
            hook.result.current.setInputName('Renamed device');
        });

        await act(async () => {
            await hook.result.current.handleSubmit();
        });

        expect(mockOnFormSubmit).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith(
            {
                type: BusDriverEventName.RENAMED_DEVICES,
                items: [{ deviceUid: DEVICE_UID, newName: 'Renamed device' }],
            },
            mockDrive
        );
        expect(mockDrive.renameDevice).toHaveBeenCalledWith(DEVICE_UID, 'Renamed device');
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Device renamed' });
        expect(onClose).toHaveBeenCalled();
    });

    describe('device name loading', () => {
        it('pre-populates inputName/deviceName with the device name', async () => {
            const { hook } = renderUseRenameDeviceModalState();

            await waitFor(() => {
                expect(hook.result.current.inputName).toBe('My laptop');
                expect(hook.result.current.deviceName).toBe('My laptop');
                expect(hook.result.current.isReady).toBe(true);
            });
        });

        it('leaves device name and inputName empty when device is not found', async () => {
            vi.mocked(getDeviceByUid).mockResolvedValue(undefined);
            const { hook } = renderUseRenameDeviceModalState();

            await waitFor(() => {
                expect(hook.result.current.isReady).toBe(true);
            });

            expect(hook.result.current.deviceName).toBe('');
            expect(hook.result.current.inputName).toBe('');
        });

        it('calls handleSdkError and still marks the modal as ready when fetching the device fails', async () => {
            vi.mocked(getDeviceByUid).mockRejectedValue(new Error('network'));
            const { hook } = renderUseRenameDeviceModalState();

            await waitFor(() => {
                expect(hook.result.current.isReady).toBe(true);
            });

            expect(handleSdkError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({ fallbackMessage: "Can't retrieve device name" })
            );
            expect(hook.result.current.deviceName).toBe('');
        });
    });

    it('skips renaming when form validation fails', async () => {
        mockOnFormSubmit.mockReturnValue(false);
        const { hook, mockDrive } = renderUseRenameDeviceModalState();

        await waitFor(() => {
            expect(hook.result.current.deviceName).toBe('My laptop');
        });

        await act(async () => {
            await hook.result.current.handleSubmit();
        });

        expect(mockOnFormSubmit).toHaveBeenCalled();
        expect(mockEmit).not.toHaveBeenCalled();
        expect(mockDrive.renameDevice).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});
