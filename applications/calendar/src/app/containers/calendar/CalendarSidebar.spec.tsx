import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useModals } from '@proton/components';
import createCache from '@proton/shared/lib/helpers/cache';
import { CacheProvider } from '@proton/components/containers/cache';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { Calendar, CALENDAR_TYPE } from '@proton/shared/lib/interfaces/calendar';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { ModalManager } from '@proton/components/containers/modals/interface';
import getHasUserReachedCalendarLimit from '@proton/shared/lib/calendar/getHasUserReachedCalendarLimit';
import CalendarModal from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import SubscribeCalendarModal from '@proton/components/containers/calendar/subscribeCalendarModal/SubscribeCalendarModal';

import CalendarSidebar, { CalendarSidebarProps } from './CalendarSidebar';

jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        call: jest.fn(),
        subscribe: jest.fn(),
    })),
}));

jest.mock('@proton/components/hooks/useFeature', () => () => ({}));
jest.mock('@proton/components/hooks/useCalendarSubscribeFeature', () => () => ({ unavailable: false, enabled: true }));

jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));

jest.mock('@proton/components/hooks/useUser', () => jest.fn(() => [{ isFree: true }, false]));

jest.mock('@proton/shared/lib/calendar/getHasUserReachedCalendarLimit', () => jest.fn(() => false));

jest.mock('@proton/components/hooks/useSubscribedCalendars', () => ({
    __esModule: true,
    default: jest.fn(() => ({ loading: true })),
}));

jest.mock('@proton/components/hooks/useCalendarUserSettings', () => ({
    __esModule: true,
    default: jest.fn(),
    useGetCalendarUserSettings: jest.fn(() => jest.fn(() => ({}))),
}));

jest.mock('@proton/components/hooks/useUserSettings', () => () => [{}, jest.fn()]);

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/hooks/useModals', () => ({
    __esModule: true,
    default: jest.fn(() => ({ createModal: jest.fn() })),
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

const mockedUseModals = useModals as jest.Mock<ReturnType<typeof useModals>>;
const mockedUseSubscribedCalendars = useSubscribedCalendars as jest.Mock<ReturnType<typeof useSubscribedCalendars>>;
const mockedGetHasUserReachedCalendarLimit = getHasUserReachedCalendarLimit as jest.Mock<
    ReturnType<typeof getHasUserReachedCalendarLimit>
>;

const mockCalendar: Calendar = {
    ID: 'id3',
    Name: 'calendar3',
    Description: 'description3',
    Display: 1, // CalendarDisplay.VISIBLE
    Color: '#f00',
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.PERSONAL,
};

function renderComponent(props?: Partial<CalendarSidebarProps>) {
    const defaultProps: CalendarSidebarProps = {
        // expanded: false,
        onToggleExpand: jest.fn(),
        logo: <span>mockedLogo</span>,
        calendars: [mockCalendar],
        miniCalendar: <span>mockedMiniCalendar</span>,
        // onCreateEvent: jest.fn(),
    };
    return (
        <ModalsProvider>
            <Router history={createMemoryHistory()}>
                <CacheProvider cache={createCache()}>
                    <CalendarSidebar {...defaultProps} {...props} />
                </CacheProvider>
            </Router>
        </ModalsProvider>
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
        const mockCreateModal = jest.fn();
        mockedUseModals.mockImplementation(
            () =>
                ({
                    createModal: mockCreateModal,
                } as unknown as ModalManager)
        );

        const { rerender } = render(renderComponent());

        expect(mockCreateModal).not.toHaveBeenCalled();

        const addCalendarElem = screen.getByText(/Add calendar$/) as HTMLSpanElement;
        const getCreatePersonalCalendarButton = () => screen.queryByText(/Create calendar/) as HTMLButtonElement;
        const getCreateSubscribedCalendarButton = () =>
            screen.queryByText(/Add calendar from URL/) as HTMLButtonElement;

        fireEvent.click(addCalendarElem);
        fireEvent.click(getCreatePersonalCalendarButton());

        await waitFor(() => {
            expect(mockCreateModal).toHaveBeenCalledWith(<CalendarModal activeCalendars={[mockCalendar]} />);
        });

        rerender(renderComponent());
        fireEvent.click(addCalendarElem);
        fireEvent.click(getCreateSubscribedCalendarButton());

        await waitFor(() => {
            expect(mockCreateModal).toHaveBeenCalledWith(<SubscribeCalendarModal />);
        });

        mockedGetHasUserReachedCalendarLimit.mockImplementation(() => true);

        rerender(renderComponent());
        fireEvent.click(addCalendarElem);
        fireEvent.click(getCreatePersonalCalendarButton());

        await waitFor(() => {
            expect(mockCreateModal).toHaveBeenCalledWith(
                <CalendarLimitReachedModal>
                    Unable to create more calendars. You have reached the maximum of personal calendars within your
                    plan.
                </CalendarLimitReachedModal>
            );
        });

        rerender(renderComponent());
        fireEvent.click(addCalendarElem);
        fireEvent.click(getCreateSubscribedCalendarButton());

        await waitFor(() => {
            expect(mockCreateModal).toHaveBeenCalledWith(
                <CalendarLimitReachedModal>
                    Unable to add more calendars. You have reached the maximum of subscribed calendars within your plan.
                </CalendarLimitReachedModal>
            );
        });
    });
});
