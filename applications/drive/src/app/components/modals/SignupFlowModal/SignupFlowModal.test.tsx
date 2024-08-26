import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import useApi from '@proton/components/hooks/useApi';
import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';
import { DRIVE_SIGNIN, DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY } from '../../../utils/url/password';
import { SignupFlowModal } from './SignupFlowModal';

jest.mock('@proton/components/hooks/useApi');
const mockedUseApi = jest.mocked(useApi);

jest.mock('@proton/shared/lib/helpers/browser');
const mockedReplaceUrl = jest.mocked(replaceUrl);

const ResizeObserverMock = jest.fn(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
}));

describe('SignupFlowModal', () => {
    let assignMock = jest.fn();

    beforeAll(() => {
        window.ResizeObserver = ResizeObserverMock;
    });

    afterEach(() => {
        localStorageWithExpiry.deleteData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY);
        assignMock.mockClear();
    });

    it('should open the modal and delete the password from localStorage on mount', () => {
        render(<SignupFlowModal urlPassword="testPassword" open onClose={() => {}} onExit={() => {}} />);
        expect(localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY)).toEqual(null);
        expect(screen.getByTestId('public-share-signup-modal-email')).toBeInTheDocument();
    });

    it('should handle email input change and validation', () => {
        render(<SignupFlowModal urlPassword="testPassword" open onClose={() => {}} onExit={() => {}} />);
        const emailInput = screen.getByTestId<HTMLInputElement>('public-share-signup-modal-email');

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        expect(emailInput.value).toBe('invalid-email');
        expect(screen.getByText('Email is not valid')).toBeInTheDocument();
    });

    it('should handle form submission and API responses correctly', async () => {
        const mockApi = jest.fn();
        mockedUseApi.mockReturnValue(mockApi);
        mockApi.mockResolvedValue({ Code: 1000 });

        render(<SignupFlowModal urlPassword="testPassword" open onClose={() => {}} onExit={() => {}} />);
        const emailInput = screen.getByTestId('public-share-signup-modal-email');
        const submitButton = screen.getByText('Continue');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY)).toEqual('testPassword');
            expect(mockedReplaceUrl).toHaveBeenCalledWith(DRIVE_SIGNUP);
        });
    });

    it('should redirect to SIGN_IN if email is already used', async () => {
        const mockApi = jest.fn();
        mockedUseApi.mockReturnValue(mockApi);
        mockApi.mockRejectedValue({ data: { Code: API_CUSTOM_ERROR_CODES.ALREADY_USED, Error: 'test message' } });

        render(<SignupFlowModal urlPassword="testPassword" open onClose={() => {}} onExit={() => {}} />);
        const emailInput = screen.getByTestId('public-share-signup-modal-email');
        const submitButton = screen.getByText('Continue');

        fireEvent.change(emailInput, { target: { value: 'used@example.com' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(localStorageWithExpiry.getData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY)).toEqual('testPassword');
            expect(mockedReplaceUrl).toHaveBeenCalledWith(DRIVE_SIGNIN);
        });
    });

    it('should display an error message for other API errors', async () => {
        const mockApi = jest.fn();
        mockedUseApi.mockReturnValue(mockApi);

        mockApi.mockRejectedValue({ data: { Code: '123456', Error: 'Some error occurred' } });

        render(<SignupFlowModal urlPassword="testPassword" open onClose={() => {}} onExit={() => {}} />);
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
