import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { updateTimeFormat } from '@proton/shared/lib/api/settings';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import TimeFormatSelector from './TimeFormatSelector';

const mockApi = jest.fn();
const mockDispatch = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    ...jest.requireActual('@proton/redux-shared-store/sharedProvider'),
    useDispatch: () => mockDispatch,
}));
jest.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: jest.fn() }));
jest.mock('@proton/shared/lib/i18n/loadLocale', () => ({ loadDateLocale: jest.fn() }));

describe('TimeFormatSelector', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useUserSettings).mockReturnValue([
            { TimeFormat: SETTINGS_TIME_FORMAT.LOCALE_DEFAULT } as any,
            false,
            undefined,
        ]);
    });

    it('renders an unstyled select when asked', () => {
        render(<TimeFormatSelector unstyledSelect />);

        expect(document.getElementById('time-format-select')).toHaveClass('select-unstyled');
    });

    it('saves the picked time format', async () => {
        mockApi.mockResolvedValue({ UserSettings: { TimeFormat: SETTINGS_TIME_FORMAT.H24 } });
        render(<TimeFormatSelector />);

        fireEvent.click(document.getElementById('time-format-select')!);
        fireEvent.click(within(screen.getByTestId('select-list')).getByText('13:00'));

        await waitFor(() => expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Preference saved' }));
        expect(mockApi).toHaveBeenCalledWith(updateTimeFormat(SETTINGS_TIME_FORMAT.H24));
    });
});
