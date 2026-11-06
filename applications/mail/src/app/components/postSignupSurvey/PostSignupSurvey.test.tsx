import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';

import { PostSignupSurvey } from './PostSignupSurvey';

jest.mock('@proton/app-context/useApi');

const mockApi = jest.fn();
const onClose = jest.fn();

const renderSurvey = () => render(<PostSignupSurvey onClose={onClose} />);

describe('PostSignupSurvey', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockApi.mockResolvedValue({});
        jest.mocked(useApi).mockReturnValue(mockApi as any);
    });

    it('dismisses and closes once', () => {
        renderSurvey();
        fireEvent.click(screen.getByText('Dismiss'));
        fireEvent.click(screen.getByText('Dismiss'));

        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({ url: 'mail/v4/onboarding-survey/dismiss' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes even when the dismiss request fails', async () => {
        mockApi.mockRejectedValue(new Error('offline'));
        renderSurvey();
        fireEvent.click(screen.getByText('Dismiss'));

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('submits both steps, and "none" excludes other providers', async () => {
        renderSurvey();
        fireEvent.click(screen.getByLabelText('No ads'));
        fireEvent.click(screen.getByText('Next'));

        fireEvent.click(screen.getByLabelText('Gmail'));
        fireEvent.click(screen.getByLabelText('Yahoo'));
        fireEvent.click(screen.getByLabelText(/didn't have one/));
        fireEvent.click(screen.getByText('Start using Proton Mail'));

        await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(1));
        const call = mockApi.mock.calls[0][0];
        expect(call.url).toBe('mail/v4/onboarding-survey/submit');
        expect(call.data.PreviousProviders).toEqual(['none']);
        expect(call.data.JoinReasonDetail).toBeUndefined();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
