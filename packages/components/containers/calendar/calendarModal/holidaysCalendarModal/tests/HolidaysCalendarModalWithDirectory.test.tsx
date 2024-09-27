import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { mocked } from 'jest-mock';

import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal/interface';
import { useNotifications } from '@proton/components/hooks';
import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';
import { localeCode, setLocales } from '@proton/shared/lib/i18n';
import type { HolidaysDirectoryCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { generateHolidaysCalendars } from '@proton/testing/lib/builders';
import { mockNotifications } from '@proton/testing/lib/mockNotifications';

import HolidaysCalendarModalWithDirectory from '../HolidaysCalendarModalWithDirectory';

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
jest.mock('@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({})),
}));
jest.mock('@proton/components/hooks/useAddressesKeys', () => ({
    __esModule: true,
    useAddressesKeys: jest.fn(() => []),
    useGetAddressKeys: jest.fn(() => []),
}));

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: () => {
        return { APP_NAME: 'proton-calendar' };
    },
}));

jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/calendar/calendarUserSettings/hooks', () => ({
    ...jest.requireActual('@proton/calendar/calendarUserSettings/hooks'),
    useCalendarUserSettings: jest.fn(),
}));

const mockedColor = '#273EB2';
jest.mock('@proton/shared/lib/colors', () => ({
    ...jest.requireActual('@proton/shared/lib/colors'),
    getRandomAccentColor: jest.fn(() => mockedColor), // return cobalt
}));

jest.mock('@proton/components/containers/calendar/hooks/useBusySlotsAvailable', () => ({
    __esModule: true,
    default: jest.fn(() => false),
}));

// Holidays calendars mocks

const frCalendar = {
    CalendarID: 'calendarID1',
    Country: 'France',
    CountryCode: 'fr',
    Hidden: false,
    LanguageCode: 'fr',
    Language: 'Français',
    Timezones: ['Europe/Paris'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const chEnCalendar = {
    CalendarID: 'calendarID2',
    Country: 'Switzerland',
    CountryCode: 'ch',
    Hidden: false,
    LanguageCode: 'en',
    Language: 'English',
    Timezones: ['Europe/Zurich'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const chDeCalendar = {
    CalendarID: 'calendarID3',
    Country: 'Switzerland',
    CountryCode: 'ch',
    Hidden: false,
    LanguageCode: 'de',
    Language: 'Deutsch',
    Timezones: ['Europe/Zurich'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const beFrCalendar = {
    CalendarID: 'calendarID4',
    Country: 'Belgium',
    CountryCode: 'be',
    Hidden: false,
    LanguageCode: 'fr',
    Language: 'Français',
    Timezones: ['Europe/Brussels'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const beNlCalendar = {
    CalendarID: 'calendarID5',
    Country: 'Belgium',
    CountryCode: 'be',
    Hidden: false,
    LanguageCode: 'nl',
    Language: 'Dutch',
    Timezones: ['Europe/Brussels'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const nlCalendar = {
    CalendarID: 'calendarID6',
    Country: 'Netherlands',
    CountryCode: 'nl',
    Hidden: false,
    LanguageCode: 'nl',
    Language: 'Dutch',
    Timezones: ['Europe/Brussels'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const esCalendar = {
    CalendarID: 'calendarID7',
    Country: 'Spain',
    CountryCode: 'es',
    Hidden: false,
    LanguageCode: 'es',
    Language: 'Español',
    Timezones: ['Europe/Madrid'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const esBaCalendar = {
    CalendarID: 'calendarID8',
    Country: 'Spain',
    CountryCode: 'es',
    Hidden: false,
    LanguageCode: 'eu',
    Language: 'Euskera',
    Timezones: ['Europe/Madrid'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const esCaCalendar = {
    CalendarID: 'calendarID9',
    Country: 'Spain',
    CountryCode: 'es',
    Hidden: false,
    LanguageCode: 'ca',
    Language: 'Català',
    Timezones: ['Europe/Madrid'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const esGlCalendar = {
    CalendarID: 'calendarID10',
    Country: 'Spain',
    CountryCode: 'es',
    Hidden: false,
    LanguageCode: 'gl',
    Language: 'Galego',
    Timezones: ['Europe/Madrid'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const itItCalendar = {
    CalendarID: 'calendarID11',
    Country: 'Italy',
    CountryCode: 'it',
    Hidden: true,
    LanguageCode: 'it',
    Language: 'Italiano',
    Timezones: ['Europe/Rome'],
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};

const directory: HolidaysDirectoryCalendar[] = [
    frCalendar,
    chEnCalendar,
    chDeCalendar,
    beNlCalendar,
    beFrCalendar,
    nlCalendar,
    esCalendar,
    esBaCalendar,
    esCaCalendar,
    esGlCalendar,
    itItCalendar,
];

const holidaysCalendars: VisualCalendar[] = generateHolidaysCalendars(2, [
    { id: frCalendar.CalendarID, name: 'Holidays in France', color: ACCENT_COLORS_MAP.cerise.color },
    { id: chEnCalendar.CalendarID, name: 'Holidays in Switzerland', color: ACCENT_COLORS_MAP.carrot.color },
]);

describe('HolidaysCalendarModal - Subscribe to a holidays calendar', () => {
    const mockedUseNotifications = mocked(useNotifications);

    beforeEach(async () => {
        mockedUseNotifications.mockImplementation(() => mockNotifications);
    });

    afterEach(async () => {
        setLocales({ localeCode: 'en_US', languageCode: 'en' });
    });

    const setup = ({
        inputCalendar,
        holidaysCalendars = [],
        type = CALENDAR_MODAL_TYPE.COMPLETE,
    }: {
        inputCalendar?: VisualCalendar;
        holidaysCalendars?: VisualCalendar[];
        type?: CALENDAR_MODAL_TYPE;
    }) => {
        render(
            <HolidaysCalendarModalWithDirectory
                calendar={inputCalendar}
                directory={directory}
                holidaysCalendars={holidaysCalendars}
                open
                type={type}
            />
        );
    };

    describe('Add a holidays calendar', () => {
        describe('List of calendars', () => {
            it('should only offer non-hidden calendars', () => {
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Something else' }, false]);

                setup({});

                const countrySelect = screen.getByText('Please select a country');
                fireEvent.click(countrySelect);

                // expected countries
                expect(screen.getByText('France')).toBeInTheDocument();
                expect(screen.getByText('Switzerland')).toBeInTheDocument();
                expect(screen.getByText('Belgium')).toBeInTheDocument();
                expect(screen.getByText('Netherlands')).toBeInTheDocument();
                expect(screen.getByText('Spain')).toBeInTheDocument();

                // hidden countries
                expect(screen.queryByText('Italy')).not.toBeInTheDocument();
            });
        });

        describe('Pre-selected fields', () => {
            it('should pre-select the suggested holidays calendar based on time zone', async () => {
                // Mock user's time zone to Paris
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' }, false]);

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is pre-selected
                screen.getByText('France');

                // Hint is displayed before country select focus
                screen.getByText('Based on your time zone');

                const countrySelect = screen.getByTestId('country-select');
                fireEvent.click(countrySelect);

                // Hint is displayed within country select
                within(screen.getByTestId('select-list')).getByText('Based on your time zone');

                // Preselected option is focused
                const preselectedOption = await screen.findByTestId('preselected-country-select-option');
                expect(preselectedOption).toHaveTextContent('France');
                expect(preselectedOption).toHaveClass('dropdown-item--is-selected');

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

            it('should pre-select the suggested holidays calendar based on time zone and user language', async () => {
                // Mock user's time zone to Zurich
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Zurich' }, false]);

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is pre-selected
                screen.getByText('Switzerland');

                // Hint is displayed before country select focus
                screen.getByText('Based on your time zone');

                const countrySelect = screen.getByTestId('country-select');
                fireEvent.click(countrySelect);

                // Hint is displayed within country select
                within(screen.getByTestId('select-list')).getByText('Based on your time zone');

                // Preselected option is focused
                const preselectedOption = await screen.findByTestId('preselected-country-select-option');
                expect(preselectedOption).toHaveTextContent('Switzerland');
                expect(preselectedOption).toHaveClass('dropdown-item--is-selected');

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

            it('should pre-select the suggested holidays calendar based on time zone and first language', async () => {
                setLocales({ localeCode, languageCode: 'something' });

                // Mock user's time zone to Spain
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Madrid' }, false]);

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Country is pre-selected
                screen.getByText('Spain');

                // Hint is displayed before country select focus
                screen.getByText('Based on your time zone');

                const countrySelect = screen.getByTestId('country-select');
                fireEvent.click(countrySelect);

                // Hint is displayed within country select
                within(screen.getByTestId('select-list')).getByText('Based on your time zone');

                // Preselected option is focused
                const preselectedOption = await screen.findByTestId('preselected-country-select-option');
                expect(preselectedOption).toHaveTextContent('Spain');
                expect(preselectedOption).toHaveClass('dropdown-item--is-selected');

                // Language is shown because there's several languages for this country
                screen.getByText('Català');

                // Random color has been selected (we mock the result to be cobalt)
                screen.getByText('cobalt');

                // No notification set
                const notificationInput = screen.queryByTestId('notification-time-input');
                expect(notificationInput).toBeNull();

                // Add notification button is visible
                screen.getByTestId('add-notification');
            });

            it('should not pre-select a suggested holidays calendar when no corresponding time zone is found', () => {
                // Mock user's time zone to something which does not exist in holidays calendars list we get
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

            it('should not pre-select a suggested holidays calendar that is not visible', () => {
                // @ts-ignore
                useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Rome' }, false]);
                setLocales({ localeCode: 'it_IT', languageCode: 'it' });

                setup({});

                // Modal title and subtitle are displayed
                screen.getByText('Add public holidays');
                screen.getByText("Get a country's official public holidays calendar.");

                // Italy is NOT pre-selected and NOT offered
                screen.getByText('Please select a country');
            });
        });

        describe('Already added holidays calendar', () => {
            it('should not pre-select the suggested calendar if the user already added it', () => {
                // Mock user's time zone to Paris
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

            it('should display an error message when selecting a country of an already added holidays calendar', () => {
                // Mock user's time zone to Paris
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

                // Select France
                const franceDropdownOption = screen.getByText('France');
                fireEvent.click(franceDropdownOption);

                // Click "Add"
                const submitButton = screen.getByText('Add');
                fireEvent.click(submitButton);

                // An error is displayed under the country input
                screen.getByText('You already added this holidays calendar');
            });
        });
    });

    describe('Edit a holidays calendar', () => {
        it('should pre-select all fields in modal', async () => {
            // Mock user's time zone to Paris
            // @ts-ignore
            useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' }, false]);

            setup({
                holidaysCalendars,
                inputCalendar: holidaysCalendars[0],
                type: CALENDAR_MODAL_TYPE.COMPLETE,
            });

            await waitFor(() => {
                expect(screen.getByText('Edit calendar'));
            });

            // Modal title is displayed
            screen.getByText('Edit calendar');
            // No modal subtitle is displayed
            const subtitle = screen.queryByText("Get a country's official public holidays calendar.");
            expect(subtitle).toBeNull();

            // Edited country is selected
            screen.getByText('France');

            // Hint should not be displayed on edition
            const hint = screen.queryByText('Based on your time zone');
            expect(hint).toBeNull();

            // Language is NOT shown because there's only one available for this country
            const languageInput = screen.queryByTestId('holidays-calendar-modal:language-select');
            expect(languageInput).toBeNull();

            // Random color has been selected (we mock the result to be cobalt)
            screen.getByText('cerise');

            // Add notification button is NOT visible in edit mode
            const notificationButton = screen.queryByTestId('add-notification');
            expect(notificationButton).toBeInTheDocument();
        });

        it('should display a message when user wants to change country to an already added holidays calendar', async () => {
            // Mock user's time zone to Zurich
            // @ts-ignore
            useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Zurich' }, false]);

            setup({
                holidaysCalendars,
                inputCalendar: holidaysCalendars[1],
                type: CALENDAR_MODAL_TYPE.COMPLETE,
            });

            await waitFor(() => {
                expect(screen.getByText('Edit calendar'));
            });

            // No modal subtitle is displayed
            const subtitle = screen.queryByText("Get a country's official public holidays calendar.");
            expect(subtitle).toBeNull();

            // Country is pre-selected
            const countryInput = screen.getByText('Switzerland');

            // Random color has been selected (we mock the result to be cobalt)
            screen.getByText('carrot');

            // Add notification button is NOT visible in edit mode
            const notificationButton = screen.queryByTestId('add-notification');
            expect(notificationButton).toBeInTheDocument();

            // Open dropdown
            fireEvent.click(countryInput);

            // Select France
            const frDropdownOption = screen.getByText('France');
            fireEvent.click(frDropdownOption);

            // An error is displayed under the country input after trying to save
            const submitButton = screen.getByText('Save');
            fireEvent.click(submitButton);

            screen.getByText('You already added this holidays calendar');
        });

        it('should allow to edit a hidden calendar', async () => {
            // Mock user's time zone to Paris
            // @ts-ignore
            useCalendarUserSettings.mockReturnValue([{ PrimaryTimezone: 'Europe/Paris' }, false]);

            const holidaysCalendars = generateHolidaysCalendars(1, [
                {
                    id: itItCalendar.CalendarID,
                    name: 'Giorni festivi e ricorrenze in Italia',
                    color: ACCENT_COLORS_MAP.cerise.color,
                },
            ]);

            setup({
                holidaysCalendars,
                inputCalendar: holidaysCalendars[0],
                type: CALENDAR_MODAL_TYPE.COMPLETE,
            });

            await waitFor(() => {
                expect(screen.getByText('Edit calendar'));
            });

            // No modal subtitle is displayed
            const subtitle = screen.queryByText("Get a country's official public holidays calendar.");
            expect(subtitle).toBeNull();

            // Edited country is selected
            screen.getByText('Italy');
        });
    });
});
