import React from 'react';
import { Router } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getUnixTime } from 'date-fns';
import { createMemoryHistory } from 'history';

import { CacheProvider } from '@proton/components/containers/cache';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { CALENDAR_FLAGS, CALENDAR_TYPE, SETTINGS_VIEW } from '@proton/shared/lib/calendar/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { CALENDAR_SUBSCRIPTION_STATUS, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarSidebar, { CalendarSidebarProps } from './CalendarSidebar';

jest.mock('@proton/components/containers/calendar/calendarModal/CalendarModal', () => ({
    __esModule: true,
    CalendarModal: jest.fn(({ open }) => <span>{open ? 'CalendarModal' : null}</span>),
    // It's not great having to mock this export manually, but the only alternative would be
    // to move the enum definition somewhere else. Ideally we shouldn't mock CalendarModal at all
    CALENDAR_MODAL_TYPE: {
        COMPLETE: 0,
        SHARED: 1,
        VISUAL: 2,
    },
}));

jest.mock('@proton/components/containers/calendar/subscribedCalendarModal/SubscribedCalendarModal', () => ({
    __esModule: true,
    default: jest.fn(({ open }) => <span>{open ? 'SubscribedCalendarModal' : null}</span>),
}));

jest.mock('@proton/components/containers/calendar/CalendarLimitReachedModal', () => ({
    __esModule: true,
    default: jest.fn(({ open }) => <span>{open ? 'CalendarLimitReachedModal' : null}</span>),
}));

jest.mock('@proton/components/hooks/useModals', () => ({
    __esModule: true,
    default: jest.fn(() => ({ createModal: jest.fn() })),
}));

jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        call: jest.fn(),
        subscribe: jest.fn(),
    })),
}));

jest.mock('@proton/components/hooks/useFeature', () => () => ({}));
jest.mock('@proton/components/hooks/useCalendarSubscribeFeature', () => () => ({ unavailable: false, enabled: true }));

jest.mock('@proton/components/hooks/useWelcomeFlags', () => ({
    __esModule: true,
    default: jest.fn(() => [{ isWelcomeFlow: false }]),
}));

jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));

jest.mock('@proton/components/hooks/useUser', () => ({
    __esModule: true,
    default: jest.fn(() => [{ hasPaidMail: true }, false]),
    useGetUser: jest.fn(),
}));

jest.mock('@proton/components/hooks/useSubscribedCalendars', () => ({
    __esModule: true,
    default: jest.fn(() => ({ loading: true })),
}));

jest.mock('@proton/components/hooks/useWelcomeFlags', () => ({
    __esModule: true,
    default: jest.fn(() => [{ isWelcomeFlow: false }]),
}));

jest.mock('@proton/components/hooks/useUserSettings', () => () => [{}, jest.fn()]);

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/containers/eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({
        subscribe: jest.fn(),
    })),
}));

jest.mock('@proton/components/helpers/appVersion', () => ({
    getAppVersion: () => 'appVersion',
}));

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn(() => ({ APP_NAME: 'proton-calendar' })),
}));

const mockedUseSubscribedCalendars = useSubscribedCalendars as jest.Mock<ReturnType<typeof useSubscribedCalendars>>;

const mockCalendar: VisualCalendar = {
    ID: 'id3',
    Name: 'calendar3',
    Description: 'description3',
    Email: 'email3',
    Display: 1, // CalendarDisplay.VISIBLE
    Color: '#f00',
    Permissions: 127,
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.PERSONAL,
    Owner: { Email: 'email3' },
    Members: [
        {
            CalendarID: 'id3',
            Color: '#f00',
            Display: 1,
            Email: 'email3',
            ID: 'memberId',
            AddressID: 'addressId',
            Flags: CALENDAR_FLAGS.ACTIVE,
            Permissions: 127,
            Name: 'calendar3',
            Description: 'description3',
        },
    ],
};

function renderComponent(props?: Partial<CalendarSidebarProps>) {
    mockedUseSubscribedCalendars.mockImplementation((calendars: VisualCalendar[]) => {
        const subscribedCalendars = calendars.map((calendar) => ({
            ...calendar,
            SubscriptionParameters: {
                CalendarID: calendar.ID,
                CreateTime: 0,
                LastUpdateTime: getUnixTime(Date.now()),
                Status: CALENDAR_SUBSCRIPTION_STATUS.OK,
                URL: 'url',
            },
        }));

        return { subscribedCalendars, loading: false };
    });
    const defaultProps: CalendarSidebarProps = {
        // expanded: false,
        onToggleExpand: jest.fn(),
        logo: <span>mockedLogo</span>,
        addresses: [],
        calendars: [mockCalendar],
        miniCalendar: <span>mockedMiniCalendar</span>,
        calendarUserSettings: {
            WeekLength: 7,
            DisplayWeekNumber: 1,
            DefaultCalendarID: '1',
            AutoDetectPrimaryTimezone: 1,
            PrimaryTimezone: 'America/New_York',
            DisplaySecondaryTimezone: 0,
            SecondaryTimezone: null,
            ViewPreference: SETTINGS_VIEW.WEEK,
            InviteLocale: null,
            AutoImportInvite: 0,
        },
        // onCreateEvent: jest.fn(),
    };
    return (
        <Router history={createMemoryHistory()}>
            <CacheProvider cache={createCache()}>
                <CalendarSidebar {...defaultProps} {...props} />
            </CacheProvider>
        </Router>
    );
}

describe('CalendarSidebar', () => {
    it('renders ', async () => {
        const { rerender } = render(renderComponent());

        expect(mockedUseSubscribedCalendars).toHaveBeenCalled();

        expect(screen.getByText(/mockedLogo/)).toBeInTheDocument();
        expect(screen.getByText(/mockedMiniCalendar/)).toBeInTheDocument();

        const myCalendarsButton = screen.getByTestId('calendar-sidebar:my-calendars-button');
        expect(myCalendarsButton).toBeInTheDocument();
        expect(screen.queryByText(/Subscribed calendars/)).not.toBeInTheDocument();

        expect(screen.getByText(/calendar3/)).toBeInTheDocument();
        expect(screen.getByText(/Add calendar/)).toBeInTheDocument();

        const manageCalendarsLink = screen.getByRole(/link/) as HTMLAnchorElement;

        expect(manageCalendarsLink.href).toBe('http://localhost/calendar/calendars');

        fireEvent.click(myCalendarsButton);

        expect(screen.queryByText(/calendar3/)).not.toBeInTheDocument();

        rerender(
            renderComponent({
                calendars: [{ ...mockCalendar, Type: CALENDAR_TYPE.SUBSCRIPTION }],
            })
        );

        const subscribedCalendarsButton = screen.getByTestId('calendar-sidebar:other-calendars-button');

        expect(screen.getByTestId('calendar-sidebar:my-calendars-button')).toBeInTheDocument();
        expect(subscribedCalendarsButton).toBeInTheDocument();

        expect(screen.getByText(/calendar3/)).toBeInTheDocument();
        fireEvent.click(subscribedCalendarsButton);
        expect(screen.queryByText(/calendar3/)).not.toBeInTheDocument();
    });

    it('displays modals when adding calendars', async () => {
        const { rerender } = render(renderComponent());

        const getCalendarModal = () => screen.queryByText(/^CalendarModal/);
        const getSubscribedCalendarModal = () => screen.queryByText(/^SubscribedCalendarModal/);
        const getCalendarLimitReachedModal = () => screen.queryByText(/^CalendarLimitReachedModal/);

        expect(getCalendarModal()).not.toBeInTheDocument();
        expect(getSubscribedCalendarModal()).not.toBeInTheDocument();
        expect(getCalendarLimitReachedModal()).not.toBeInTheDocument();

        const addCalendarElem = () => screen.getByText(/Add calendar$/) as HTMLSpanElement;
        const getCreatePersonalCalendarButton = () => screen.queryByText(/Create calendar/) as HTMLButtonElement;
        const getCreateSubscribedCalendarButton = () =>
            screen.queryByText(/Add calendar from URL/) as HTMLButtonElement;

        fireEvent.click(addCalendarElem());

        fireEvent.click(getCreatePersonalCalendarButton());

        await waitFor(() => {
            expect(getCalendarModal()).toBeInTheDocument();
            expect(getSubscribedCalendarModal()).not.toBeInTheDocument();
        });

        rerender(renderComponent());
        fireEvent.click(addCalendarElem());
        fireEvent.click(getCreateSubscribedCalendarButton());

        await waitFor(() => {
            expect(getSubscribedCalendarModal()).toBeInTheDocument();
            // TODO: Fix the test; they don't work
            // expect(getCalendarModal()).not.toBeInTheDocument();
        });

        // TODO: Fix the tests below; they don't work
        // rerender(renderComponent({ calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID) }));
        // fireEvent.click(addCalendarElem());
        //
        // await waitFor(() => {
        //     expect(getCalendarLimitReachedModal()).toBeInTheDocument();
        // });
        //
        // expect(
        //     screen.getByText(
        //         'Max of calendars reached. To add a new calendar, remove an existing one.'
        //     )
        // ).toBeInTheDocument();
        //
        // rerender(renderComponent({ calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID - 1) }));
        // fireEvent.click(addCalendarElem);
        // fireEvent.click(getCreateSubscribedCalendarButton());
        //
        // expect(getSubscribedCalendarModal()).toBeInTheDocument();
        // expect(
        //     screen.getByText(
        //         'Max of calendars reached. To add a new calendar, remove an existing one.'
        //     )
        // ).toBeInTheDocument();
    });
});
