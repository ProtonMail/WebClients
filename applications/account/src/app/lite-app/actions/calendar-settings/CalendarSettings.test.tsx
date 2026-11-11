import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { calendarSettingsActions } from '@proton/calendar/calendarUserSettings';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useIsMeetVideoConferenceEnabled } from '@proton/components/containers/calendar/settings/useIsMeetVideoConferenceEnabled';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { DEFAULT_CALENDAR_USER_SETTINGS } from '@proton/shared/lib/calendar/calendar';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';

import CalendarSettings from './CalendarSettings';

const mockApi = jest.fn();
const mockDispatch = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('@proton/calendar/calendarUserSettings/hooks', () => ({ useCalendarUserSettings: jest.fn() }));
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
jest.mock('../../../private-app/store/hooks', () => ({ useAccountDispatch: () => mockDispatch }));
jest.mock('@proton/components/containers/calendar/settings/useIsMeetVideoConferenceEnabled', () => ({
    useIsMeetVideoConferenceEnabled: jest.fn(),
}));
jest.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: jest.fn() }));

// Selectors that save on their own are covered by their own tests; only their presence matters here
jest.mock('@proton/components/containers/calendar/settings/PrimaryTimezoneSelector', () => ({
    __esModule: true,
    default: ({ id }: { id: string }) => <div id={id} />,
}));
jest.mock('@proton/components/containers/calendar/settings/WeekStartSelector', () => ({
    __esModule: true,
    default: () => <div id="week-start-select" />,
}));
jest.mock('@proton/components/containers/general/LanguageSelector', () => ({
    __esModule: true,
    default: ({ id }: { id: string }) => <div id={id} />,
}));
jest.mock('@proton/components/containers/general/TimeFormatSelector', () => ({
    __esModule: true,
    default: ({ id }: { id: string }) => <div id={id} />,
}));
jest.mock('@proton/components/containers/calendar/settings/InviteLocaleSelector', () => ({
    __esModule: true,
    default: ({ id, locale }: { id: string; locale: string | null }) => <div id={id} data-locale={locale} />,
}));
jest.mock('@proton/shared/lib/i18n/locales', () => ({ locales: { en_US: jest.fn(), fr_FR: jest.fn() } }));

const mockedUseCalendarUserSettings = jest.mocked(useCalendarUserSettings);
const mockedUseUserSettings = jest.mocked(useUserSettings);
const mockedUseIsMeetVideoConferenceEnabled = jest.mocked(useIsMeetVideoConferenceEnabled);

const settings: CalendarUserSettings = { ...DEFAULT_CALENDAR_USER_SETTINGS, DisplayWeekNumber: 0, InviteLocale: null };

const renderCalendarSettings = (calendarUserSettings: CalendarUserSettings | undefined = settings, loading = false) => {
    mockedUseCalendarUserSettings.mockReturnValue([calendarUserSettings as CalendarUserSettings, loading]);
    return render(<CalendarSettings layout={(children) => children} loader={<div>loader</div>} />);
};

describe('CalendarSettings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseUserSettings.mockReturnValue([{ WeekStart: 1 } as any, false, undefined]);
        mockedUseIsMeetVideoConferenceEnabled.mockReturnValue(true);
    });

    it('renders the loader while calendar user settings load', () => {
        renderCalendarSettings(undefined, true);

        expect(screen.getByText('loader')).toBeInTheDocument();
        expect(screen.queryByText('Time zone')).not.toBeInTheDocument();
    });

    it('renders the loader while user settings load', () => {
        mockedUseUserSettings.mockReturnValue([undefined as any, true, undefined]);
        renderCalendarSettings();

        expect(screen.getByText('loader')).toBeInTheDocument();
        expect(screen.queryByText('Time zone')).not.toBeInTheDocument();
    });

    it('renders every general setting', () => {
        const { container } = renderCalendarSettings();

        ['Time zone', 'Layout', 'Language and time', 'Invitations'].forEach((title) => {
            expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
        });
        [
            'autodetect-primary-timezone',
            'primary-timezone',
            'week-start-select',
            'week-numbers-display',
            'language-select',
            'time-format-select',
            'invite-locale',
            'auto-import-invitations',
            'auto-add-meet-link',
        ].forEach((id) => {
            expect(container.querySelector(`#${id}`)).toBeInTheDocument();
        });
    });

    it('removes the default view and secondary time zone settings', () => {
        const { container } = renderCalendarSettings();

        ['view-select', 'show-secondary-timezone', 'secondary-timezone'].forEach((id) => {
            expect(container.querySelector(`#${id}`)).not.toBeInTheDocument();
        });
    });

    it('has no date format setting', () => {
        const { container } = renderCalendarSettings();

        expect(container.querySelector('#date-format-select')).not.toBeInTheDocument();
        expect(screen.queryByText('Date format')).not.toBeInTheDocument();
    });

    it('shows the new invitation descriptions', () => {
        renderCalendarSettings();

        expect(screen.getByText('You still need to reply for the organizer to see your response.')).toBeInTheDocument();
        expect(screen.getByText('Adds a Meet link to events with at least one participant.')).toBeInTheDocument();
    });

    it('saves week numbers and updates the store', async () => {
        const savedSettings = { ...settings, DisplayWeekNumber: 1 };
        mockApi.mockResolvedValue({ CalendarUserSettings: savedSettings });
        const { container } = renderCalendarSettings();

        fireEvent.click(container.querySelector('#week-numbers-display')!);

        await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(calendarSettingsActions.update(savedSettings)));
        expect(mockApi).toHaveBeenCalledWith(updateCalendarUserSettings({ DisplayWeekNumber: 1 }));
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Preference saved' });
    });

    it('hides the Meet links row when Meet video conferencing is not available', () => {
        mockedUseIsMeetVideoConferenceEnabled.mockReturnValue(false);
        const { container } = renderCalendarSettings();

        expect(container.querySelector('#auto-add-meet-link')).not.toBeInTheDocument();
    });

    it('has no Zoom setting or calendars entry', () => {
        const { container } = renderCalendarSettings();

        expect(screen.queryByRole('heading', { name: 'Integrations' })).not.toBeInTheDocument();
        expect(container.querySelector('#zoomToggle')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Calendars' })).not.toBeInTheDocument();
    });

    it('shows the closest available locale for the invite language', () => {
        const { container } = renderCalendarSettings({ ...settings, InviteLocale: 'fr' });

        expect(container.querySelector('#invite-locale')).toHaveAttribute('data-locale', 'fr_FR');
    });
});
