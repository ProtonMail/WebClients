import { fireEvent, render, screen } from '@testing-library/react';
import { mocked } from 'jest-mock';

import HolidaysCalendarModal from '@proton/components/containers/calendar/holidaysCalendarModal/HolidaysCalendarModal';
import { useCalendarUserSettings, useNotifications } from '@proton/components/hooks';
import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';
import { wait } from '@proton/shared/lib/helpers/promise';
import { localeCode, setLocales } from '@proton/shared/lib/i18n';
import { HolidaysDirectoryCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { mockNotifications } from '@proton/testing/lib/mockNotifications';

jest.mock('@proton/components/hooks/useAddresses', () => ({
    __esModule: true,
    default: jest.fn(() => []),
    useGetAddresses: jest.fn(),
}));
jest.mock('@proton/components/hooks/useGetCalendarBootstrap', () => ({
    __esModule: true,
    default: jest.fn(() => () => Promise.resolve({ CalendarSettings: { DefaultFullDayNotifications: [] } })),
    useReadCalendarBootstrap: jest.fn(),
}));
jest.mock('@proton/components/hooks/useEventManager', () => () => ({}));
jest.mock('@proton/components/hooks/useGetAddressKeys', () => () => ({}));
jest.mock('@proton/components/hooks/useNotifications');

jest.mock('@proton/components/hooks/useCalendarUserSettings', () => ({
    ...jest.requireActual('@proton/components/hooks/useCalendarUserSettings'),
    useCalendarUserSettings: jest.fn(),
}));

const mockedColor = '#273EB2';
jest.mock('@proton/shared/lib/colors', () => ({
    ...jest.requireActual('@proton/shared/lib/colors'),
    getRandomAccentColor: jest.fn(() => mockedColor), // return cobalt
}));

// Holidays calendars mocks
const firstCalendarID = 'calendar1';
const secCalendarID = 'calendar2';

const holidaysDirectory: HolidaysDirectoryCalendar[] = [
    {
        CalendarID: firstCalendarID,
        Country: 'France',
        CountryCode: 'fr',
        LanguageCode: 'fr',
        Language: 'Français',
        Timezones: ['Europe/Paris'],
    } as HolidaysDirectoryCalendar,
    {
        CalendarID: secCalendarID,
        Country: 'Switzerland',
        CountryCode: 'ch',
        LanguageCode: 'en',
        Language: 'English',
        Timezones: ['Europe/Zurich'],
    } as HolidaysDirectoryCalendar,
    {
        CalendarID: 'calendar3',
        Country: 'Switzerland',
        CountryCode: 'ch',
        LanguageCode: 'de',
        Language: 'Deutsch',
        Timezones: ['Europe/Zurich'],
    } as HolidaysDirectoryCalendar,
];

const holidaysCalendars: VisualCalendar[] = [
    { ID: firstCalendarID, Name: 'Holidays in France', Color: ACCENT_COLORS_MAP.cerise.color } as VisualCalendar,
    { ID: secCalendarID, Name: 'Holidays in Switzerland', Color: ACCENT_COLORS_MAP.carrot.color } as VisualCalendar,
];

describe('HolidaysCalendarModal - Subscribe to a holidays calendar', () => {
    const mockedUseNotifications = mocked(useNotifications);

    beforeEach(async () => {
        mockedUseNotifications.mockImplementation(() => mockNotifications);
        setLocales({ localeCode, languageCode: 'en' });
    });

    const setup = ({
        inputCalendar,
        holidaysCalendars = [],
        showNotification,
    }: {
        inputCalendar?: VisualCalendar;
        holidaysCalendars?: VisualCalendar[];
        showNotification?: boolean;
    }) => {
        render(
            <HolidaysCalendarModal
                directory={holidaysDirectory}
                calendar={inputCalendar}
                holidaysCalendars={holidaysCalendars}
                showNotification={showNotification}
                open
            />
        );
    };

    describe('Add a holidays calendar', () => {
        describe('Pre-selected fields', () => {
            it('should pre-select the default holidays calendar based on timezone', () => {
                // Mock user's timezone to Paris
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' }, false]);

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is pre-selected
                screen.getByText('France');

                // Hint is displayed
                screen.getByText('Based on your time zone');

                // Language is NOT shown because there's only one available for this country
                const languageInput = screen.queryByTestId('holidays-calendar-modal:language-select');
                expect(languageInput).toBeNull();

                // Random color has been selected (we mock the result to be cobalt)
                screen.getByText('cobalt');

                // No notification set
                const notificationInput = screen.queryByTestId('notification-time-input');
                expect(notificationInput).toBeNull();

                // Add notification button is visible
                screen.getByTestId('add-notification');
            });

            it('should pre-select the default holidays calendar based on timezone and user language', () => {
                // Mock user's timezone to Zurich
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Zurich' }, false]);

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is pre-selected
                screen.getByText('Switzerland');

                // Hint is displayed
                screen.getByText('Based on your time zone');

                // Language is shown because there's several languages for this country
                screen.getByText('English');

                // Random color has been selected (we mock the result to be cobalt)
                screen.getByText('cobalt');

                // No notification set
                const notificationInput = screen.queryByTestId('notification-time-input');
                expect(notificationInput).toBeNull();

                // Add notification button is visible
                screen.getByTestId('add-notification');
            });

            it('should pre-select the default holidays calendar based on timezone and first language', () => {
                setLocales({ localeCode, languageCode: 'something' });

                // Mock user's timezone to Zurich
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Zurich' }, false]);

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is pre-selected
                screen.getByText('Switzerland');

                // Hint is displayed
                screen.getByText('Based on your time zone');

                // Language is shown because there's several languages for this country
                screen.getByText('Deutsch');

                // Random color has been selected (we mock the result to be cobalt)
                screen.getByText('cobalt');

                // No notification set
                const notificationInput = screen.queryByTestId('notification-time-input');
                expect(notificationInput).toBeNull();

                // Add notification button is visible
                screen.getByTestId('add-notification');
            });

            it('should not pre-select a default holidays calendar when no corresponding time zone is found', () => {
                // Mock user's timezone to something which does not exist in holidays calendars list we get
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Something else' }, false]);

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is NOT pre-selected
                screen.getByText('Please select a country');

                // Hint is NOT displayed
                const hint = screen.queryByText('Based on your time zone');
                expect(hint).toBeNull();

                // Language is NOT shown because no default country is found
                const languageInput = screen.queryByTestId('holidays-calendar-modal:language-select');
                expect(languageInput).toBeNull();

                // Random color has been selected (we mock the result to be cobalt)
                screen.getByText('cobalt');

                // No notification set
                const notificationInput = screen.queryByTestId('notification-time-input');
                expect(notificationInput).toBeNull();

                // Add notification button is visible
                screen.getByTestId('add-notification');
            });
        });

        describe('Already subscribed holidays calendar', () => {
            it('should not pre-select the default calendar if the user already subscribed to it', () => {
                // Mock user's timezone to Paris
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' }, false]);

                setup({ holidaysCalendars });

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is NOT pre-selected
                screen.getByText('Please select a country');

                // Hint is NOT displayed
                const hint = screen.queryByText('Based on your time zone');
                expect(hint).toBeNull();

                // Language is NOT shown because there's only one available for this country
                const languageInput = screen.queryByTestId('holidays-calendar-modal:language-select');
                expect(languageInput).toBeNull();

                // Random color has been selected (we mock the result to be cobalt)
                screen.getByText('cobalt');

                // No notification set
                const notificationInput = screen.queryByTestId('notification-time-input');
                expect(notificationInput).toBeNull();

                // Add notification button is visible
                screen.getByTestId('add-notification');
            });

            it('should display an error message when selecting a country of an already subscribed holidays calendar', () => {
                // Mock user's timezone to Paris
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' }, false]);

                setup({ holidaysCalendars });

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is NOT pre-selected
                const countryInput = screen.getByText('Please select a country');

                // Open dropdown
                fireEvent.click(countryInput);

                const franceDropdownOption = screen.getByText('France');

                // Select France
                fireEvent.click(franceDropdownOption);

                // An error is displayed under the country input
                screen.getByText('You already subscribed to this holidays calendar');
            });
        });
    });

    describe('Edit a holidays calendar', () => {
        it('should pre-select all fields in modal', async () => {
            // Mock user's timezone to Paris
            // @ts-ignore
            useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' }, false]);

            setup({
                holidaysCalendars,
                inputCalendar: holidaysCalendars[0],
                showNotification: false,
            });

            // "Fake" wait because modal is on a loading state by default
            await wait(0);

            // Modal title is displayed
            screen.getByText('Edit calendar');
            // No modal subtitle is displayed
            const subtitle = screen.queryByText("Get a country's official public holidays calendar.");
            expect(subtitle).toBeNull();

            // Country is pre-selected
            screen.getByText('France');

            // Hint is displayed
            screen.getByText('Based on your time zone');

            // Language is NOT shown because there's only one available for this country
            const languageInput = screen.queryByTestId('holidays-calendar-modal:language-select');
            expect(languageInput).toBeNull();

            // Random color has been selected (we mock the result to be cobalt)
            screen.getByText('cerise');

            // Add notification button is NOT visible in edit mode
            const notificationButton = screen.queryByTestId('add-notification');
            expect(notificationButton).toBeNull();
        });

        it('should display a message when user wants to change country to an already subscribed calendar', async () => {
            // Mock user's timezone to Zurich
            // @ts-ignore
            useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Zurich' }, false]);

            setup({
                holidaysCalendars,
                inputCalendar: holidaysCalendars[1],
                showNotification: false,
            });

            // "Fake" wait because modal is on a loading state by default
            await wait(0);

            // Modal title is displayed
            screen.getByText('Edit calendar');
            // No modal subtitle is displayed
            const subtitle = screen.queryByText("Get a country's official public holidays calendar.");
            expect(subtitle).toBeNull();

            // Country is pre-selected
            const countryInput = screen.getByText('Switzerland');

            // Random color has been selected (we mock the result to be cobalt)
            screen.getByText('carrot');

            // Add notification button is NOT visible in edit mode
            const notificationButton = screen.queryByTestId('add-notification');
            expect(notificationButton).toBeNull();

            // Open dropdown
            fireEvent.click(countryInput);

            const frDropdownOption = screen.getByText('France');

            // Select France
            fireEvent.click(frDropdownOption);

            // An error is displayed under the country input
            screen.getByText('You already subscribed to this holidays calendar');
        });
    });
});
