import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BYOEReminder } from './BYOEReminder';

const mockApi = vi.fn();
vi.mock('@proton/app-context/useApi', () => ({ __esModule: true, default: () => mockApi, useApi: () => mockApi }));

const mockCreateNotification = vi.fn();
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

const mockDispatch = vi.fn();
vi.mock('@proton/redux-shared-store/sharedProvider', () => ({ useDispatch: () => mockDispatch }));

let mockMailSettings: { ByoeNewMessageReminder: boolean } = { ByoeNewMessageReminder: false };
vi.mock('@proton/mail/store/mailSettings/hooks', () => ({
    useMailSettings: () => [mockMailSettings, false],
}));

describe('BYOEReminder', () => {
    beforeEach(() => {
        mockMailSettings = { ByoeNewMessageReminder: false };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('Should reflect the current setting', () => {
        mockMailSettings = { ByoeNewMessageReminder: true };
        render(<BYOEReminder />);

        expect(screen.getByRole('checkbox', { name: /Private email reminders in Gmail/ })).toBeChecked();
    });

    it('Should save the setting and store the returned mail settings', async () => {
        const MailSettings = { ByoeNewMessageReminder: true };
        mockApi.mockResolvedValue({ MailSettings });
        render(<BYOEReminder />);

        fireEvent.click(screen.getByRole('checkbox', { name: /Private email reminders in Gmail/ }));

        await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({ method: 'put', data: { ByoeNewMessageReminder: true } })
        );
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Preference saved' });
    });

    it('Should not store anything when saving fails', async () => {
        mockApi.mockRejectedValue(new Error('failed'));
        render(<BYOEReminder />);

        fireEvent.click(screen.getByRole('checkbox', { name: /Private email reminders in Gmail/ }));

        await waitFor(() => expect(mockApi).toHaveBeenCalled());
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});
