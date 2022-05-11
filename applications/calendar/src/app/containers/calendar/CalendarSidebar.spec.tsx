import React from 'react';
import { Router } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { CacheProvider } from '@proton/components/containers/cache';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { CALENDAR_FLAGS, SETTINGS_VIEW } from '@proton/shared/lib/calendar/constants';
import getHasUserReachedCalendarsLimit from '@proton/shared/lib/calendar/getHasUserReachedCalendarsLimit';
import createCache from '@proton/shared/lib/helpers/cache';
import { CALENDAR_TYPE, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarSidebar, { CalendarSidebarProps } from './CalendarSidebar';

jest.mock('@proton/components/containers/calendar/calendarModal/CalendarModal', () => ({
    __esModule: true,
    CalendarModal: jest.fn(({ open }) => <span>{open ? 'CalendarModal' : null}</span>),
}));

jest.mock('@proton/components/containers/calendar/subscribedCalendarModal/SubscribedCalendarModal', () => ({
    __esModule: true,
    default: jest.fn(({ open }) => <span>{open ? 'SubscribedCalendarModal' : null}</span>),
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
    default: jest.fn(() => [{ hasPaidMail: false }, false]),
    useGetUser: jest.fn(),
}));

jest.mock('@proton/shared/lib/calendar/getHasUserReachedCalendarsLimit', () => jest.fn(() => false));

jest.mock('@proton/components/hooks/useSubscribedCalendars', () => ({
    __esModule: true,
    default: jest.fn(() => ({ loading: true })),
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
const mockedGetHasUserReachedCalendarsLimit = getHasUserReachedCalendarsLimit as jest.Mock<
    ReturnType<typeof getHasUserReachedCalendarsLimit>
>;

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

        const myCalendarsButton = screen.getByText(/My calendars/);
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

        const subscribedCalendarsButton = screen.getByText(/Subscribed calendars/);

        expect(screen.getByText(/My calendars/)).toBeInTheDocument();
        expect(subscribedCalendarsButton).toBeInTheDocument();

        expect(screen.getByText(/calendar3/)).toBeInTheDocument();
        fireEvent.click(subscribedCalendarsButton);
        expect(screen.queryByText(/calendar3/)).not.toBeInTheDocument();
    });

    it('displays modals when adding calendars', async () => {
        const { rerender } = render(renderComponent());

        const getCalendarModal = () => screen.queryByText(/^CalendarModal/);
        const getSubscribedCalendarModal = () => screen.queryByText(/^SubscribedCalendarModal/);

        expect(getCalendarModal()).not.toBeInTheDocument();
        expect(getSubscribedCalendarModal()).not.toBeInTheDocument();

        const addCalendarElem = screen.getByText(/Add calendar$/) as HTMLSpanElement;
        const getCreatePersonalCalendarButton = () => screen.queryByText(/Create calendar/) as HTMLButtonElement;
        const getCreateSubscribedCalendarButton = () =>
            screen.queryByText(/Add calendar from URL/) as HTMLButtonElement;

        fireEvent.click(addCalendarElem);

        fireEvent.click(getCreatePersonalCalendarButton());

        await waitFor(() => {
            expect(getCalendarModal()).toBeInTheDocument();
        });

        rerender(renderComponent());
        fireEvent.click(addCalendarElem);
        fireEvent.click(getCreateSubscribedCalendarButton());

        expect(getCalendarModal()).toBeInTheDocument();

        mockedGetHasUserReachedCalendarsLimit.mockImplementation(() => ({
            isPersonalCalendarsLimitReached: true,
            isSharedCalendarsLimitReached: true,
            isSubscribedCalendarsLimitReached: true,
        }));

        rerender(renderComponent());
        fireEvent.click(addCalendarElem);
        fireEvent.click(getCreatePersonalCalendarButton());

        expect(getCalendarModal()).toBeInTheDocument();

        expect(
            screen.getByText(
                /Unable to create more calendars. You have reached the maximum of personal calendars within your plan./
            )
        ).toBeInTheDocument();

        rerender(renderComponent());
        fireEvent.click(addCalendarElem);
        fireEvent.click(getCreateSubscribedCalendarButton());

        expect(getSubscribedCalendarModal()).toBeInTheDocument();
        expect(
            screen.getByText(
                /Unable to add more calendars. You have reached the maximum of subscribed calendars within your plan./
            )
        ).toBeInTheDocument();
    });
});
