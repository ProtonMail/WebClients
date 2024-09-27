import { Router } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getUnixTime } from 'date-fns';
import { createMemoryHistory } from 'history';

import { CacheProvider, useSubscribedCalendars } from '@proton/components';
import {
    CALENDAR_FLAGS,
    CALENDAR_TYPE,
    MAX_CALENDARS_PAID,
    SETTINGS_VIEW,
} from '@proton/shared/lib/calendar/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { CALENDAR_SUBSCRIPTION_STATUS } from '@proton/shared/lib/interfaces/calendar';
import { generateOwnedPersonalCalendars, generateSubscribedCalendars } from '@proton/testing/lib/builders';
import { mockUseAuthentication } from '@proton/testing/lib/mockUseAuthentication';
import noop from '@proton/utils/noop';

import type { CalendarSidebarProps } from './CalendarSidebar';
import CalendarSidebar from './CalendarSidebar';

jest.mock('@proton/components/containers/calendar/calendarModal/personalCalendarModal/PersonalCalendarModal', () => ({
    __esModule: true,
    default: jest.fn(({ open }) => <span>{open ? 'PersonalCalendarModal' : null}</span>),
}));

jest.mock(
    '@proton/components/containers/calendar/calendarModal/subscribedCalendarModal/SubscribedCalendarModal',
    () => ({
        __esModule: true,
        default: jest.fn(({ open }) => <span>{open ? 'SubscribedCalendarModal' : null}</span>),
    })
);

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

jest.mock('@proton/features/useFeature', () => () => ({}));

jest.mock('@proton/components/hooks/useWelcomeFlags', () => ({
    __esModule: true,
    useWelcomeFlags: jest.fn(() => [{ isWelcomeFlow: false }]),
}));

jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));

jest.mock('@proton/components/hooks/useAuthentication', () => () => ({}));

jest.mock('@proton/components/hooks/useUser', () => ({
    __esModule: true,
    default: jest.fn(() => [{ hasPaidMail: true, Flags: {} }, false]),
    useGetUser: jest.fn(() => () => [{ hasPaidMail: true, Flags: {} }, false]),
}));

jest.mock('@proton/components/hooks/useSubscribedCalendars', () => ({
    __esModule: true,
    default: jest.fn(() => ({ loading: true })),
}));

jest.mock('@proton/components/hooks/useWelcomeFlags', () => ({
    __esModule: true,
    useWelcomeFlags: jest.fn(() => [{ isWelcomeFlow: false }]),
}));

jest.mock('@proton/components/hooks/useUserSettings', () => () => [{}, jest.fn()]);
jest.mock('@proton/components/hooks/useSubscription', () => () => [{}, jest.fn()]);

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider', () => ({
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

jest.mock('@proton/calendar/holidaysDirectory/hooks', () => ({
    __esModule: true,
    default: jest.fn(() => []),
}));

jest.mock('@proton/components/hooks/drawer/useDrawer', () => () => {
    return { toggleDrawerApp: jest.fn() };
});

jest.mock('@proton/components/containers/organization/logoUpload/useOrganizationTheme.ts', () => ({
    __esModule: true,
    useOrganizationTheme: jest.fn(() => ({
        logoURL: 'logo',
        showName: false,
        name: 'org',
        access: false,
    })),
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
        onCreateCalendar: noop,
    };
    mockUseAuthentication({} as any);
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

        expect(getByText(/mockedMiniCalendar/)).toBeInTheDocument();

        const myCalendarsButton = getByTestId('calendar-sidebar:my-calendars-button');
        expect(myCalendarsButton).toBeInTheDocument();
        expect(queryByText(/Other calendars/)).not.toBeInTheDocument();

        expect(getByText(/calendar3/)).toBeInTheDocument();
        expect(getByText(/Add calendar/)).toBeInTheDocument();

        const manageCalendarsLink = getByRole('link', { name: 'Calendars' }) as HTMLAnchorElement;

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

        const getCalendarModal = () => queryByText(/^PersonalCalendarModal/);
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

        const getCalendarModal = () => queryByText(/^PersonalCalendarModal/);
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

        const getCalendarModal = () => queryByText(/^PersonalCalendarModal/);
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

        const getCalendarModal = () => queryByText(/^PersonalCalendarModal/);
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
