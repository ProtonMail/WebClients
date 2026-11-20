import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';
import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';
import { DRIVE_SIGNIN } from '@proton/shared/lib/drive/urls';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { assignUrl } from '@proton/shared/lib/helpers/location';
import { setLocation } from '@proton/vitest-config/setLocation';

import usePublicToken from '../../../../legacy/hooks/drive/usePublicToken';
import type * as TelemetryModule from '../../../../utils/telemetry';
import { PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY } from '../../../../utils/url/password';
import { SignupFlowModal } from './SignupFlowModal';

vi.mock('@proton/app-context/useApi');
const mockedUseApi = vi.mocked(useApi);

vi.mock('@proton/shared/lib/helpers/browser');
vi.mock('@proton/shared/lib/helpers/location');

vi.mock('../../../../utils/telemetry', async (importOriginal) => ({
    ...(await importOriginal<typeof TelemetryModule>()),
    countActionWithTelemetry: vi.fn().mockResolvedValue(undefined),
    traceTelemetry: vi.fn(() => ({ start: vi.fn().mockResolvedValue(undefined), end: vi.fn() })),
}));

vi.mock('../../../../legacy/hooks/drive/usePublicToken');
const mockUrlPassword = 'mockUrlPassword';
const mockToken = 'mockToken';

vi.mocked(usePublicToken).mockReturnValue({
    token: mockToken,
    urlPassword: mockUrlPassword,
});

const ResizeObserverMock = vi.fn(function () {
    return {
        disconnect: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
    };
});

describe('SignupFlowModal', () => {
    const originalResizeObserver = window.ResizeObserver;

    beforeAll(() => {
        Object.defineProperty(window, 'ResizeObserver', {
            value: ResizeObserverMock,
            writable: true,
        });
        setLocation('/urls/mockpath#mockhash');
    });

    afterEach(() => {
        localStorageWithExpiry.deleteData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY);
    });

    afterAll(() => {
        Object.defineProperty(window, 'ResizeObserver', {
            value: originalResizeObserver,
            writable: true,
        });
    });

    it('should open the modal and delete the password from localStorage on mount', () => {
        render(<SignupFlowModal open onClose={() => {}} onExit={() => {}} />);
        expect(localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY)).toEqual(null);
        expect(screen.getByTestId('public-share-signup-modal-email')).toBeInTheDocument();
    });

    it('should handle email input change and validation', () => {
        render(<SignupFlowModal open onClose={() => {}} onExit={() => {}} />);
        const emailInput = screen.getByTestId<HTMLInputElement>('public-share-signup-modal-email');

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        expect(emailInput.value).toBe('invalid-email');
        expect(screen.getByText('Email is not valid')).toBeInTheDocument();
    });

    it('should handle form submission and API responses correctly', async () => {
        const mockApi = vi.fn();
        mockedUseApi.mockReturnValue(mockApi);
        mockApi.mockResolvedValue({ Code: 1000 });
        render(<SignupFlowModal open onClose={() => {}} onExit={() => {}} />);
        const emailInput = screen.getByTestId('public-share-signup-modal-email');
        const submitButton = screen.getByText('Continue');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY)).toEqual(mockUrlPassword);
        });
        await waitFor(() => {
            expect(vi.mocked(assignUrl)).toHaveBeenCalledWith(expect.stringContaining('email=test%40example.com'));
        });
    });

    it('should redirect to SIGN_IN if email is already used', async () => {
        const mockApi = vi.fn();
        mockedUseApi.mockReturnValue(mockApi);
        mockApi.mockRejectedValue({ data: { Code: API_CUSTOM_ERROR_CODES.ALREADY_USED, Error: 'test message' } });
        render(<SignupFlowModal open onClose={() => {}} onExit={() => {}} />);
        const emailInput = screen.getByTestId('public-share-signup-modal-email');
        const submitButton = screen.getByText('Continue');

        fireEvent.change(emailInput, { target: { value: 'used@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY)).toEqual(mockUrlPassword);
        });
        await waitFor(() => {
            expect(vi.mocked(assignUrl)).toHaveBeenCalledWith(
                `${DRIVE_SIGNIN}?username=used%40example.com&product=drive&returnUrl=%252F%253Ftoken%253DmockToken%2526drivePublicRedirectionReason%253Dsignin&returnUrlContext=private`
            );
        });
    });

    it('should display an error message for other API errors', async () => {
        const mockApi = vi.fn();
        mockedUseApi.mockReturnValue(mockApi);

        mockApi.mockRejectedValue({ data: { Code: '123456', Error: 'Some error occurred' } });

        render(<SignupFlowModal open onClose={() => {}} onExit={() => {}} />);
        const emailInput = screen.getByTestId('public-share-signup-modal-email');
        const submitButton = screen.getByText('Continue');

        fireEvent.change(emailInput, { target: { value: 'error@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY)).toEqual(null);
            expect(screen.getByText('Some error occurred')).toBeInTheDocument();
        });
    });
});
