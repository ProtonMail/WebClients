import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { getModelState } from '@proton/account/testing/getModelState';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import { extraThunkArguments } from '../../tests/protonStore';
import { easySwitchRender } from '../../tests/render';
import ByoeReminderToggle from './ByoeReminderToggle';

const mockApi = vi.fn();

const mockCreateNotification = vi.fn();
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

const renderWithSetting = (ByoeNewMessageReminder: boolean) => {
    return easySwitchRender(<ByoeReminderToggle />, {
        mailSettings: getModelState({ ByoeNewMessageReminder } as MailSettings),
    });
};

const getToggle = () => {
    return screen.getByRole('checkbox', { name: 'Private email reminders in Gmail' });
};

describe('ByoeReminderToggle', () => {
    beforeEach(() => {
        extraThunkArguments.api = mockApi as unknown as typeof extraThunkArguments.api;
        mockApi.mockReset();
        mockCreateNotification.mockReset();
    });

    it('reflects the ByoeNewMessageReminder mail setting when disabled', () => {
        renderWithSetting(false);

        expect(getToggle()).not.toBeChecked();
    });

    it('reflects the ByoeNewMessageReminder mail setting when enabled', () => {
        renderWithSetting(true);

        expect(getToggle()).toBeChecked();
    });

    it('sends only the boolean to the BYOE reminder route, updates the store and notifies', async () => {
        mockApi.mockResolvedValue({ MailSettings: { ByoeNewMessageReminder: true } });
        renderWithSetting(false);

        fireEvent.click(getToggle());

        await waitFor(() => {
            expect(getToggle()).toBeChecked();
        });
        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(mockApi).toHaveBeenCalledWith({
            url: 'mail/v4/settings/byoe-new-message-reminder',
            method: 'put',
            data: { ByoeNewMessageReminder: true },
        });
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Preference saved' });
    });

    it('sends false when turning the reminder off', async () => {
        mockApi.mockResolvedValue({ MailSettings: { ByoeNewMessageReminder: false } });
        renderWithSetting(true);

        fireEvent.click(getToggle());

        await waitFor(() => {
            expect(getToggle()).not.toBeChecked();
        });
        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining({ data: { ByoeNewMessageReminder: false } }));
    });

    it('keeps the previous value and shows no success notification when the request fails', async () => {
        mockApi.mockRejectedValue(new Error('failure'));
        renderWithSetting(false);

        fireEvent.click(getToggle());

        await waitFor(() => {
            expect(mockApi).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
            expect(getToggle()).not.toBeChecked();
        });
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });
});
