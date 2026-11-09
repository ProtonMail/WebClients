import { useContext } from 'react';

import { act, render, screen } from '@testing-library/react';

import { mockUseUser } from '@proton/account/testing/mockUseUser';
import { ThemeColor } from '@proton/colors/types';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';

import useKeyTransparencyNotification from '../../hooks/useKeyTransparencyNotification';
import { QuickSettingsRemindersContext } from './MailQuickSettingsReminderContext';
import MailQuickSettingsReminderContextProvider from './MailQuickSettingsReminderContextProvider';

jest.mock('../../hooks/useKeyTransparencyNotification');

const Reminders = () => {
    const context = useContext(QuickSettingsRemindersContext);
    return <span data-testid="reminders">{context?.reminders.join(',')}</span>;
};

const renderProvider = () => {
    render(
        <MailQuickSettingsReminderContextProvider>
            <Reminders />
        </MailQuickSettingsReminderContextProvider>
    );
};

/** Opening the key transparency details sends `true`, a successful self-audit sends `false` */
const sendReminderUpdate = (value: boolean) => {
    act(() => {
        document.dispatchEvent(new CustomEvent(KEY_TRANSPARENCY_REMINDER_UPDATE, { detail: { value } }));
    });
};

describe('MailQuickSettingsReminderContextProvider', () => {
    beforeEach(() => {
        window.localStorage.clear();
        mockUseUser([{ ID: 'user' }]);
        jest.mocked(useKeyTransparencyNotification).mockReturnValue(ThemeColor.Danger);
    });

    it('hides the key transparency reminder once the user has seen the details', () => {
        renderProvider();
        expect(screen.getByTestId('reminders')).toHaveTextContent(ThemeColor.Danger);

        sendReminderUpdate(true);

        expect(screen.getByTestId('reminders')).toBeEmptyDOMElement();
    });

    it('shows the key transparency reminder again after the next successful audit', () => {
        renderProvider();
        sendReminderUpdate(true);

        sendReminderUpdate(false);

        expect(screen.getByTestId('reminders')).toHaveTextContent(ThemeColor.Danger);
    });
});
