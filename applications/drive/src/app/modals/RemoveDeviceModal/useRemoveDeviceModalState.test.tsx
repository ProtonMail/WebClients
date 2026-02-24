import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import { useFormErrors, useNotifications } from '@proton/components';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { useLoading } from '@proton/hooks';

import { getDeviceByUid } from '../../utils/sdk/getDeviceByUid';
import { getDeviceName } from '../../utils/sdk/getNodeName';
import { type UseRemoveDeviceModalProps, useRemoveDeviceModalState } from './useRemoveDeviceModalState';

jest.mock('@proton/components', () => ({
    useFormErrors: jest.fn(),
    useNotifications: jest.fn(),
}));

jest.mock('@proton/hooks', () => ({
    useLoading: jest.fn(),
}));

jest.mock('../../utils/errorHandling/handleSdkError');

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
const mockDevice = { uid: 'device-uid' } as any;
const DEVICE_UID = 'device-uid';

describe('useRemoveDeviceModalState', () => {
    beforeEach(() => {
        jest.mocked(useFormErrors).mockReturnValue({
            validator: mockValidator,
            onFormSubmit: mockOnFormSubmit,
        } as any);

        jest.mocked(useNotifications).mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        jest.mocked(useLoading).mockReturnValue([false, mockWithSubmitting] as any);
        mockWithSubmitting.mockImplementation((promise: Promise<unknown>) => promise);

        jest.mocked(getBusDriver).mockReturnValue({
            emit: mockEmit,
        } as any);

        jest.mocked(getDeviceByUid).mockResolvedValue(mockDevice);
        jest.mocked(getDeviceName).mockReturnValue('My device');

        mockValidator.mockReturnValue(null);
        mockOnFormSubmit.mockReturnValue(true);
        mockEmit.mockResolvedValue(undefined);
        mockCreateNotification.mockClear();
        mockHandleError.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderRemoveDeviceModal = () => {
        const mockDrive = {
            deleteDevice: jest.fn().mockResolvedValue(undefined),
        };
        const onClose = jest.fn();
        const hookProps: UseRemoveDeviceModalProps = {
            deviceUid: DEVICE_UID,
            drive: mockDrive as any,
            onClose,
            open: true,
            onExit: jest.fn(),
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
        expect(mockEmit).toHaveBeenCalledWith({
            type: BusDriverEventName.REMOVED_DEVICES,
            deviceUids: [DEVICE_UID],
        });
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
