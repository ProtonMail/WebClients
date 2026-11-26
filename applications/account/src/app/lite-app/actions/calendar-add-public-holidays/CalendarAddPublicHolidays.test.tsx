import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useUser } from '@proton/account/user/hooks';
import joinHolidaysCalendar from '@proton/calendar-settings/calendarModal/holidaysCalendarModal/joinHolidaysCalendar';
import useBusySlotsAvailable from '@proton/calendar-settings/hooks/useBusySlotsAvailable';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useGetHolidaysDirectory } from '@proton/calendar/holidaysDirectory/hooks';
import { getBusySlotSettingValue } from '@proton/components/helpers/busySlots';
import { CALENDAR_TYPE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import type {
    CalendarWithOwnMembers,
    HolidaysDirectoryCalendar,
} from '@proton/shared/lib/interfaces/calendar/Calendar';

import broadcast, { MessageType } from '../../broadcast';
import CalendarAddPublicHolidays from './CalendarAddPublicHolidays';

const mockCall = vi.fn();
const mockGetHolidaysDirectory = vi.fn();
const mockAddresses = [{ ID: 'address-1', Email: 'me@example.com' }];
const mockedColor = '#273EB2';

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@proton/account/addresses/hooks', () => ({ useGetAddresses: () => async () => mockAddresses }));
vi.mock('@proton/account/addressKeys/hooks', () => ({ useGetAddressKeys: () => vi.fn() }));
vi.mock('@proton/components/hooks/useEventManager', () => ({ __esModule: true, default: () => ({ call: mockCall }) }));
vi.mock('@proton/calendar/holidaysDirectory/hooks', () => ({ useGetHolidaysDirectory: vi.fn() }));
vi.mock('@proton/calendar/calendarUserSettings/hooks', () => ({ useCalendarUserSettings: vi.fn() }));
vi.mock('@proton/calendar/calendars/hooks', () => ({ useCalendars: vi.fn() }));
vi.mock('@proton/account/user/hooks', () => ({ useUser: vi.fn() }));
vi.mock('@proton/calendar-settings/hooks/useBusySlotsAvailable', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/calendar-settings/calendarModal/holidaysCalendarModal/joinHolidaysCalendar', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('@proton/shared/lib/colors', async () => ({
    ...(await vi.importActual('@proton/shared/lib/colors')),
    getRandomAccentColor: vi.fn(() => mockedColor),
}));
vi.mock('../../broadcast', async () => ({
    ...(await vi.importActual('../../broadcast')),
    __esModule: true,
    default: vi.fn(),
}));

const mockedJoin = vi.mocked(joinHolidaysCalendar);
const mockedBroadcast = vi.mocked(broadcast);

const getDirectoryCalendar = (
    calendar: Pick<
        HolidaysDirectoryCalendar,
        'CalendarID' | 'Country' | 'CountryCode' | 'LanguageCode' | 'Language'
    > & {
        Timezone: string;
    }
): HolidaysDirectoryCalendar => ({
    ...calendar,
    Hidden: false,
    Timezones: [calendar.Timezone],
    Passphrase: 'dummyPassphrase',
    SessionKey: { Key: 'dummyKey', Algorithm: 'dummyAlgorithm' },
});

const frCalendar = getDirectoryCalendar({
    CalendarID: 'calendarID1',
    Country: 'France',
    CountryCode: 'fr',
    LanguageCode: 'fr',
    Language: 'Français',
    Timezone: 'Europe/Paris',
});
const chEnCalendar = getDirectoryCalendar({
    CalendarID: 'calendarID2',
    Country: 'Switzerland',
    CountryCode: 'ch',
    LanguageCode: 'en',
    Language: 'English',
    Timezone: 'Europe/Zurich',
});
const chDeCalendar = getDirectoryCalendar({
    CalendarID: 'calendarID3',
    Country: 'Switzerland',
    CountryCode: 'ch',
    LanguageCode: 'de',
    Language: 'Deutsch',
    Timezone: 'Europe/Zurich',
});
const beCalendar = getDirectoryCalendar({
    CalendarID: 'calendarID4',
    Country: 'Belgium',
    CountryCode: 'be',
    LanguageCode: 'fr',
    Language: 'Français',
    Timezone: 'Europe/Brussels',
});
const directory = [frCalendar, chEnCalendar, chDeCalendar, beCalendar];

const getCalendar = (ID: string, Type: CALENDAR_TYPE) => ({
    ID,
    Type,
    Owner: { Email: Type === CALENDAR_TYPE.PERSONAL ? 'me@example.com' : 'holidays@proton.me' },
    Members: [{ Email: 'me@example.com', Name: ID, Color: '#000000', Display: 1, Priority: 1 }],
});
const ownedCalendar = getCalendar('own', CALENDAR_TYPE.PERSONAL);
const getJoinedHolidaysCalendar = (calendar: HolidaysDirectoryCalendar) =>
    getCalendar(calendar.CalendarID, CALENDAR_TYPE.HOLIDAYS);

const renderPage = async ({ calendars = [ownedCalendar] }: { calendars?: unknown[] } = {}) => {
    vi.mocked(useCalendars).mockReturnValue([calendars as CalendarWithOwnMembers[], false]);
    const result = render(<CalendarAddPublicHolidays layout={(children) => children} loader={<div>loader</div>} />);
    await waitFor(() => expect(screen.queryByText('loader')).not.toBeInTheDocument());
    return result;
};

const selectCountry = async (country: string) => {
    await userEvent.click(screen.getByRole('button', { name: 'Country' }));
    await userEvent.click(await screen.findByRole('button', { name: country }));
};

const getAddButton = () => screen.getByRole('button', { name: 'Add' });

describe('CalendarAddPublicHolidays', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetHolidaysDirectory.mockResolvedValue(directory);
        vi.mocked(useGetHolidaysDirectory).mockReturnValue(mockGetHolidaysDirectory);
        vi.mocked(useCalendarUserSettings).mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' } as any, false]);
        vi.mocked(useUser).mockReturnValue([{ isFree: false } as any, false]);
        vi.mocked(useBusySlotsAvailable).mockReturnValue(false);
        mockedJoin.mockResolvedValue({} as any);
        mockCall.mockResolvedValue(undefined);
    });

    it('renders the loader while the directory loads', () => {
        mockGetHolidaysDirectory.mockReturnValue(new Promise(() => {}));
        vi.mocked(useCalendars).mockReturnValue([[ownedCalendar] as CalendarWithOwnMembers[], false]);
        render(<CalendarAddPublicHolidays layout={(children) => children} loader={<div>loader</div>} />);

        expect(screen.getByText('loader')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });

    it('preselects the suggested country and shows the time zone hint', async () => {
        await renderPage();

        expect(screen.getByText("Get a country's official public holidays calendar.")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Country' })).toHaveTextContent('France');
        expect(screen.getByText('Based on your time zone')).toBeInTheDocument();
        expect(getAddButton()).toBeEnabled();
    });

    it('names the color picker with its label and the selected color', async () => {
        await renderPage();

        expect(screen.getByRole('button', { name: 'Color cobalt' })).toBeInTheDocument();
    });

    it('does not preselect a suggested calendar the user already added', async () => {
        await renderPage({ calendars: [ownedCalendar, getJoinedHolidaysCalendar(frCalendar)] });

        expect(screen.getByRole('button', { name: 'Country' }).textContent).toBe('Select');
        expect(screen.queryByText('Based on your time zone')).not.toBeInTheDocument();
        expect(getAddButton()).toBeDisabled();
    });

    it('shows the already-added error and disables Add when that country is picked, and clears it for another country', async () => {
        await renderPage({ calendars: [ownedCalendar, getJoinedHolidaysCalendar(chEnCalendar)] });

        await selectCountry('Switzerland');

        expect(screen.getByRole('alert')).toHaveTextContent('You already added this holidays calendar');
        expect(getAddButton()).toBeDisabled();

        await selectCountry('Belgium');

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(getAddButton()).toBeEnabled();
    });

    it('shows the language row only for multi-language countries', async () => {
        await renderPage();
        expect(screen.queryByRole('button', { name: 'Language' })).not.toBeInTheDocument();

        await selectCountry('Switzerland');

        expect(screen.getByRole('button', { name: 'Language' })).toHaveTextContent('English');
    });

    it('sends SUCCESS after joining', async () => {
        await renderPage();

        await userEvent.click(getAddButton());

        await waitFor(() => expect(mockedBroadcast).toHaveBeenCalledWith({ type: MessageType.SUCCESS }));
        expect(mockedBroadcast).toHaveBeenCalledTimes(1);
        expect(mockedJoin).toHaveBeenCalledWith(
            expect.objectContaining({
                holidaysCalendar: frCalendar,
                addresses: mockAddresses,
                color: mockedColor,
                notifications: [],
                makesUserBusy: getBusySlotSettingValue(CALENDAR_TYPE.HOLIDAYS),
            })
        );
        expect(mockCall).toHaveBeenCalledTimes(1);
    });

    it('joins only once on a double tap', async () => {
        mockedJoin.mockReturnValue(new Promise(() => {}));
        await renderPage();

        const addButton = getAddButton();
        await userEvent.click(addButton);
        await userEvent.click(addButton);

        expect(mockedJoin).toHaveBeenCalledTimes(1);
    });

    it('still sends SUCCESS when the join succeeded but a later step failed', async () => {
        mockedJoin.mockImplementation(async ({ onJoined }) => {
            onJoined?.();
            throw new Error('Settings update failed');
        });
        await renderPage();

        await userEvent.click(getAddButton());

        await waitFor(() => expect(mockedBroadcast).toHaveBeenCalledWith({ type: MessageType.SUCCESS }));
        expect(mockedBroadcast).toHaveBeenCalledTimes(1);
    });

    it('shows the error screen and sends no SUCCESS when the join fails', async () => {
        mockedJoin.mockRejectedValue(new Error('Missing primary key'));
        await renderPage();

        await userEvent.click(getAddButton());

        expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
        expect(mockedBroadcast).not.toHaveBeenCalled();
    });

    it('shows the error screen when the directory fails to load, and Cancel sends CLOSE', async () => {
        mockGetHolidaysDirectory.mockRejectedValue(new Error('Network error'));
        await renderPage();

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(mockedBroadcast).toHaveBeenCalledWith({ type: MessageType.CLOSE });
        expect(mockedBroadcast).toHaveBeenCalledTimes(1);
    });

    it('hides the form when the other-calendars limit is reached', async () => {
        const subscribed = Array.from({ length: MAX_CALENDARS_PAID - 1 }, (_, index) =>
            getCalendar(`sub-${index}`, CALENDAR_TYPE.SUBSCRIPTION)
        );
        await renderPage({ calendars: [ownedCalendar, ...subscribed] });

        expect(
            screen.getByText(/You've reached the maximum number of calendars available in your plan/)
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Country' })).not.toBeInTheDocument();
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
});
