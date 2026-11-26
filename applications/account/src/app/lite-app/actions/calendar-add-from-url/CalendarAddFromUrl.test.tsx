import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useUser } from '@proton/account/user/hooks';
import useBusySlotsAvailable from '@proton/calendar-settings/hooks/useBusySlotsAvailable';
import useGetCalendarActions from '@proton/calendar-settings/hooks/useGetCalendarActions';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { CALENDAR_SUBSCRIPTION_STATUS } from '@proton/shared/lib/interfaces/calendar/Subscription';

import broadcast, { MessageType } from '../../broadcast';
import CalendarAddFromUrl from './CalendarAddFromUrl';

const mockApi = vi.fn();
const mockHandleCreateCalendar = vi.fn();
const mockGetAddresses = vi.fn();

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn() }) }));
vi.mock('@proton/account/addresses/hooks', () => ({ useGetAddresses: () => mockGetAddresses }));
vi.mock('@proton/calendar/calendarBootstrap/hooks', () => ({ useGetCalendarBootstrap: () => vi.fn() }));
vi.mock('@proton/calendar-settings/hooks/useGetCalendarActions', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/calendar-settings/hooks/useBusySlotsAvailable', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/calendar/calendars/hooks', () => ({ useCalendars: vi.fn() }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('../../broadcast', async () => ({
    ...(await vi.importActual('../../broadcast')),
    __esModule: true,
    default: vi.fn(),
}));

const mockedUseGetCalendarActions = vi.mocked(useGetCalendarActions);
const mockedBroadcast = vi.mocked(broadcast);

const ownedCalendar = {
    ID: 'own',
    Type: 0,
    Owner: { Email: 'me@example.com' },
    Members: [{ Email: 'me@example.com' }],
};

const renderPage = async ({ calendars = [ownedCalendar] }: { calendars?: unknown[] } = {}) => {
    vi.mocked(useCalendars).mockReturnValue([calendars as CalendarWithOwnMembers[], false]);
    const result = render(<CalendarAddFromUrl layout={(children) => children} loader={<div>loader</div>} />);
    await waitFor(() => expect(screen.queryByText('loader')).not.toBeInTheDocument());
    return result;
};

const typeUrl = async (url = 'https://example.com/calendar.ics') => {
    screen.getByLabelText('Calendar URL').focus();
    await userEvent.paste(url);
};

describe('CalendarAddFromUrl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAddresses.mockResolvedValue([
            { ID: 'address-1', Email: 'me@example.com', Status: 1, Receive: 1, Send: 1, Type: 1, Flags: 0 },
        ]);
        vi.mocked(useUser).mockReturnValue([{ isFree: false } as any, false]);
        vi.mocked(useBusySlotsAvailable).mockReturnValue(false);
        mockedUseGetCalendarActions.mockImplementation(
            ({ onClose }) =>
                ({
                    handleCreateCalendar: mockHandleCreateCalendar.mockImplementation(async () => {
                        onClose?.();
                    }),
                }) as any
        );
    });

    it('renders the loader while the setup loads', () => {
        mockGetAddresses.mockReturnValue(new Promise(() => {}));
        vi.mocked(useCalendars).mockReturnValue([[ownedCalendar] as CalendarWithOwnMembers[], false]);
        render(<CalendarAddFromUrl layout={(children) => children} loader={<div>loader</div>} />);

        expect(screen.getByText('loader')).toBeInTheDocument();
        expect(screen.queryByLabelText('Calendar URL')).not.toBeInTheDocument();
    });

    it('shows "Invalid URL", and editing the URL clears it', async () => {
        mockApi.mockResolvedValue({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.INVALID_URL } });
        await renderPage();
        const addButton = screen.getByRole('button', { name: 'Add' });

        expect(addButton).toBeDisabled();
        await typeUrl('not-a-url');
        await userEvent.click(addButton);

        expect(await screen.findByText('Invalid URL')).toBeInTheDocument();
        expect(addButton).toBeDisabled();
        expect(mockHandleCreateCalendar).not.toHaveBeenCalled();

        await typeUrl('x');

        expect(screen.queryByText('Invalid URL')).not.toBeInTheDocument();
        expect(addButton).toBeEnabled();
    });

    it('sends SUCCESS once the calendar is created', async () => {
        mockApi.mockResolvedValue({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } });
        await renderPage();

        await typeUrl();
        await userEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => expect(mockedBroadcast).toHaveBeenCalledWith({ type: MessageType.SUCCESS }));
        expect(mockedBroadcast).toHaveBeenCalledTimes(1);
        expect(mockHandleCreateCalendar).toHaveBeenCalledWith(
            'address-1',
            expect.objectContaining({ URL: 'https://example.com/calendar.ics' }),
            expect.anything()
        );
    });

    it('validates only once when Add is tapped twice', async () => {
        mockApi.mockReturnValue(new Promise(() => {}));
        await renderPage();

        await typeUrl();
        const addButton = screen.getByRole('button', { name: 'Add' });
        await userEvent.click(addButton);
        await userEvent.click(addButton);

        expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('sends CLOSE on Cancel', async () => {
        await renderPage();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(mockedBroadcast).toHaveBeenCalledWith({ type: MessageType.CLOSE });
        expect(mockedBroadcast).toHaveBeenCalledTimes(1);
    });

    it('hides the form and shows the limit text when the other calendars limit is reached', async () => {
        const subscribed = Array.from({ length: MAX_CALENDARS_PAID - 1 }, (_, index) => ({
            ID: `sub-${index}`,
            Type: 1,
            Owner: { Email: 'other@example.com' },
            Members: [{ Email: 'me@example.com' }],
        }));
        await renderPage({ calendars: [ownedCalendar, ...subscribed] });

        expect(
            screen.getByText(/You've reached the maximum number of calendars available in your plan/)
        ).toBeInTheDocument();
        expect(screen.queryByLabelText('Calendar URL')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mockedBroadcast).toHaveBeenCalledWith({ type: MessageType.CLOSE });
    });

    it('shows the busy toggle only when busy slots are available', async () => {
        const { unmount } = await renderPage();
        expect(screen.queryByLabelText("Show others when I'm busy")).not.toBeInTheDocument();
        unmount();

        vi.mocked(useBusySlotsAvailable).mockReturnValue(true);
        await renderPage();
        expect(screen.getByLabelText("Show others when I'm busy")).toBeInTheDocument();
    });

    it('sends SUCCESS once when the calendar exists but the final refresh fails', async () => {
        mockApi.mockResolvedValue({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } });
        mockedUseGetCalendarActions.mockImplementation(
            ({ onCreateCalendar }) =>
                ({
                    handleCreateCalendar: mockHandleCreateCalendar.mockImplementation(async () => {
                        onCreateCalendar?.('cal-1');
                        throw new Error('Event loop failed');
                    }),
                }) as any
        );
        await renderPage();

        await typeUrl();
        await userEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => expect(mockedBroadcast).toHaveBeenCalledWith({ type: MessageType.SUCCESS }));
        expect(mockedBroadcast).toHaveBeenCalledTimes(1);
    });

    it('keeps the form and sends nothing when the create request fails', async () => {
        mockApi.mockResolvedValue({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } });
        mockedUseGetCalendarActions.mockImplementation(
            () =>
                ({
                    handleCreateCalendar: mockHandleCreateCalendar.mockRejectedValue(new Error('422')),
                }) as any
        );
        await renderPage();

        await typeUrl();
        await userEvent.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => expect(mockHandleCreateCalendar).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
        expect(screen.getByLabelText('Calendar URL')).toHaveValue('https://example.com/calendar.ics');
        expect(mockedBroadcast).not.toHaveBeenCalled();
    });

    it('shows the error screen and sends no SUCCESS when the creation fails', async () => {
        mockApi.mockResolvedValue({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } });
        mockedUseGetCalendarActions.mockImplementation(
            ({ setError }) =>
                ({
                    handleCreateCalendar: mockHandleCreateCalendar.mockImplementation(async () => {
                        setError(true);
                        throw new Error('Missing primary key');
                    }),
                }) as any
        );
        await renderPage();

        await typeUrl();
        await userEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Calendar URL')).not.toBeInTheDocument();
        expect(mockedBroadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: MessageType.SUCCESS }));
    });
});
