import { fireEvent, render, screen } from '@testing-library/react';

import { BYOEReminder } from './BYOEReminder';

const mockUpdate = vi.fn();
vi.mock('@proton/mail/hooks/useUpdateMailSetting', () => ({
    useUpdateMailSetting: () => ({ update: mockUpdate, loading: false }),
}));

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

    it('Should save the setting', () => {
        render(<BYOEReminder />);

        fireEvent.click(screen.getByRole('checkbox', { name: /Private email reminders in Gmail/ }));

        expect(mockUpdate).toHaveBeenCalledWith('ByoeNewMessageReminder', true);
    });
});
