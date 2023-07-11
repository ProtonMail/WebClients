import { Router } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getUnixTime } from 'date-fns';
import { createMemoryHistory } from 'history';

import { CacheProvider } from '@proton/components/containers/cache';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import {
    CALENDAR_FLAGS,
    CALENDAR_TYPE,
    MAX_CALENDARS_PAID,
    SETTINGS_VIEW,
} from '@proton/shared/lib/calendar/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { CALENDAR_SUBSCRIPTION_STATUS, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { generateOwnedPersonalCalendars, generateSubscribedCalendars } from '@proton/testing/lib/builders';

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

jest.mock('@proton/components/containers/calendar/hooks/useHolidaysDirectory', () => ({
    __esModule: true,
    default: jest.fn(() => []),
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
    Priority: 1,
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
            Priority: 1,
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
        onToggleExpand: jest.fn(),
        logo: <span>mockedLogo</span>,
        isNarrow: false,
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
    it('renders with no subscribed calendars', async () => {
        const { getByText, queryByText, getByTestId, getByRole } = render(renderComponent());

        expect(mockedUseSubscribedCalendars).toHaveBeenCalled();

        expect(getByText(/mockedLogo/)).toBeInTheDocument();
        expect(getByText(/mockedMiniCalendar/)).toBeInTheDocument();

        const myCalendarsButton = getByTestId('calendar-sidebar:my-calendars-button');
        expect(myCalendarsButton).toBeInTheDocument();
        expect(queryByText(/Other calendars/)).not.toBeInTheDocument();

        expect(getByText(/calendar3/)).toBeInTheDocument();
        expect(getByText(/Add calendar/)).toBeInTheDocument();

        const manageCalendarsLink = getByRole(/link/) as HTMLAnchorElement;

        expect(manageCalendarsLink.href).toBe('http://localhost/calendar/calendars');

        fireEvent.click(myCalendarsButton);

        await waitFor(() => {
            expect(screen.queryByText(/calendar3/)).not.toBeInTheDocument();
        });
    });

    it('renders with one subscribed calendar', async () => {
        const { getByTestId, getByText, queryByText } = render(
            renderComponent({
                calendars: [{ ...mockCalendar, Type: CALENDAR_TYPE.SUBSCRIPTION }],
            })
        );

        const subscribedCalendarsButton = getByTestId('calendar-sidebar:other-calendars-button');

        expect(getByTestId('calendar-sidebar:my-calendars-button')).toBeInTheDocument();
        expect(subscribedCalendarsButton).toBeInTheDocument();

        expect(getByText(/calendar3/)).toBeInTheDocument();

        fireEvent.click(subscribedCalendarsButton);

        await waitFor(() => {
            expect(queryByText(/calendar3/)).not.toBeInTheDocument();
        });
    });

    it('displays create calendar modal', async () => {
        const { queryByText, getByText } = render(renderComponent());

        const getCalendarModal = () => queryByText(/^CalendarModal/);
        const getSubscribedCalendarModal = () => queryByText(/^SubscribedCalendarModal/);
        const getCalendarLimitReachedModal = () => queryByText(/^CalendarLimitReachedModal/);

        expect(getCalendarModal()).not.toBeInTheDocument();
        expect(getSubscribedCalendarModal()).not.toBeInTheDocument();
        expect(getCalendarLimitReachedModal()).not.toBeInTheDocument();

        const addCalendarElem = () => getByText(/Add calendar$/) as HTMLSpanElement;
        const getCreatePersonalCalendarButton = () => queryByText(/Create calendar/) as HTMLButtonElement;

        fireEvent.click(addCalendarElem());

        fireEvent.click(getCreatePersonalCalendarButton());

        await waitFor(() => {
            expect(getCalendarModal()).toBeInTheDocument();
        });
        expect(getSubscribedCalendarModal()).not.toBeInTheDocument();
    });

    it('displays add subscribed calendar modal', async () => {
        const { queryByText, getByText } = render(renderComponent());

        const addCalendarElem = () => getByText(/Add calendar$/) as HTMLSpanElement;
        const getCreateSubscribedCalendarButton = () => queryByText(/Add calendar from URL/) as HTMLButtonElement;

        const getCalendarModal = () => queryByText(/^CalendarModal/);
        const getSubscribedCalendarModal = () => queryByText(/^SubscribedCalendarModal/);
        const getCalendarLimitReachedModal = () => queryByText(/^CalendarLimitReachedModal/);

        fireEvent.click(addCalendarElem());
        fireEvent.click(getCreateSubscribedCalendarButton());

        await waitFor(() => {
            expect(getSubscribedCalendarModal()).toBeInTheDocument();
        });
        expect(getCalendarModal()).not.toBeInTheDocument();
        expect(getCalendarLimitReachedModal()).not.toBeInTheDocument();
    });

    it('displays calendars limit reached modal with the max of personal calendars', async () => {
        const { getByText, queryByText } = render(
            renderComponent({ calendars: generateOwnedPersonalCalendars(MAX_CALENDARS_PAID) })
        );

        const addCalendarElem = () => getByText(/Add calendar$/) as HTMLSpanElement;

        const getCalendarModal = () => queryByText(/^CalendarModal/);
        const getSubscribedCalendarModal = () => queryByText(/^SubscribedCalendarModal/);
        const getCalendarLimitReachedModal = () => queryByText(/^CalendarLimitReachedModal/);

        fireEvent.click(addCalendarElem());

        await waitFor(() => {
            expect(getCalendarLimitReachedModal()).toBeInTheDocument();
        });
        expect(getCalendarModal()).not.toBeInTheDocument();
        expect(getSubscribedCalendarModal()).not.toBeInTheDocument();
    });

    it('allows to create personal calendar when the user is at the max of subscribed calendars', async () => {
        const { getByText, queryByText } = render(
            renderComponent({ calendars: generateSubscribedCalendars(MAX_CALENDARS_PAID - 1) })
        );

        const addCalendarElem = () => getByText(/Add calendar$/) as HTMLSpanElement;

        const getCalendarModal = () => queryByText(/^CalendarModal/);
        const getSubscribedCalendarModal = () => queryByText(/^SubscribedCalendarModal/);
        const getCalendarLimitReachedModal = () => queryByText(/^CalendarLimitReachedModal/);

        fireEvent.click(addCalendarElem());

        await waitFor(() => {
            expect(getCalendarModal()).toBeInTheDocument();
        });
        expect(getCalendarLimitReachedModal()).not.toBeInTheDocument();
        expect(getSubscribedCalendarModal()).not.toBeInTheDocument();
    });
});
