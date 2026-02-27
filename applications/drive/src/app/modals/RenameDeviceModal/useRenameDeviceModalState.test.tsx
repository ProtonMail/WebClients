import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import { useFormErrors, useNotifications } from '@proton/components';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { useLoading } from '@proton/hooks';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getDeviceByUid } from '../../utils/sdk/getDeviceByUid';
import { getDeviceName } from '../../utils/sdk/getNodeName';
import { type UseRenameDeviceModalProps, useRenameDeviceModalState } from './useRenameDeviceModalState';

jest.mock('@proton/components', () => ({
    useFormErrors: jest.fn(),
    useNotifications: jest.fn(),
}));

jest.mock('@proton/hooks', () => ({
    ...jest.requireActual('@proton/hooks'),
    useLoading: jest.fn(),
}));

jest.mock('../../utils/errorHandling/handleSdkError', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../../utils/sdk/getDeviceByUid', () => ({
    getDeviceByUid: jest.fn(),
}));

jest.mock('../../utils/sdk/getNodeName', () => ({
    getDeviceName: jest.fn(),
}));

jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(),
}));

jest.mock('@proton/shared/lib/helpers/formValidators', () => ({
    requiredValidator: jest.fn((value: string) => ({ type: 'required', value })),
}));

const mockValidator = jest.fn();
const mockOnFormSubmit = jest.fn();
const mockCreateNotification = jest.fn();
const mockHandleError = jest.fn();
const mockWithSubmitting = jest.fn();
const mockEmit = jest.fn();

const DEVICE_UID = 'device-uid';
const mockDevice = { uid: DEVICE_UID } as any;

describe('useRenameDeviceModalState', () => {
    beforeEach(() => {
        jest.mocked(useFormErrors).mockReturnValue({
            validator: mockValidator,
            onFormSubmit: mockOnFormSubmit,
        } as any);

        jest.mocked(useNotifications).mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        jest.mocked(useLoading).mockReturnValue([false, mockWithSubmitting] as any);

        jest.mocked(getBusDriver).mockReturnValue({
            emit: mockEmit,
        } as any);

        jest.mocked(getDeviceByUid).mockResolvedValue(mockDevice);
        jest.mocked(getDeviceName).mockReturnValue('My laptop');

        mockValidator.mockReturnValue(null);
        mockOnFormSubmit.mockReturnValue(true);
        mockWithSubmitting.mockImplementation((promise: Promise<unknown>) => promise);
        mockEmit.mockResolvedValue(undefined);
        mockCreateNotification.mockClear();
        mockHandleError.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderUseRenameDeviceModalState = () => {
        const mockDrive = {
            renameDevice: jest.fn().mockResolvedValue(undefined),
        };
        const onClose = jest.fn();
        const hookProps = {
            deviceUid: DEVICE_UID,
            drive: mockDrive as any,
            onClose,
            open: true,
            onExit: jest.fn(),
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
        expect(mockEmit).toHaveBeenCalledWith({
            type: BusDriverEventName.RENAMED_DEVICES,
            items: [{ deviceUid: DEVICE_UID, newName: 'Renamed device' }],
        });
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
            jest.mocked(getDeviceByUid).mockResolvedValue(undefined);
            const { hook } = renderUseRenameDeviceModalState();

            await waitFor(() => {
                expect(hook.result.current.isReady).toBe(true);
            });

            expect(hook.result.current.deviceName).toBe('');
            expect(hook.result.current.inputName).toBe('');
        });

        it('calls handleSdkError and still marks the modal as ready when fetching the device fails', async () => {
            jest.mocked(getDeviceByUid).mockRejectedValue(new Error('network'));
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
