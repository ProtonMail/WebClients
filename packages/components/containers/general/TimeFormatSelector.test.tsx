import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { updateTimeFormat } from '@proton/shared/lib/api/settings';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import TimeFormatSelector from './TimeFormatSelector';

const mockApi = vi.fn();
const mockDispatch = vi.fn();
const mockCreateNotification = vi.fn();

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
vi.mock('@proton/redux-shared-store/sharedProvider', async () => ({
    ...(await vi.importActual('@proton/redux-shared-store/sharedProvider')),
    useDispatch: () => mockDispatch,
}));
vi.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: vi.fn() }));
vi.mock('@proton/shared/lib/i18n/loadLocale', () => ({ loadDateLocale: vi.fn() }));

describe('TimeFormatSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUserSettings).mockReturnValue([
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
