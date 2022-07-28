import React from 'react';
import { Router } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { CacheProvider } from '@proton/components/containers/cache';
import useUser from '@proton/components/hooks/useUser';
import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_FLAGS, CALENDAR_SETTINGS_SUBSECTION_ID } from '@proton/shared/lib/calendar/constants';
import { CALENDAR_TYPE, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import createCache from '@proton/shared/lib/helpers/cache';
import { UserModel } from '@proton/shared/lib/interfaces';

import CalendarSidebarListItems, { CalendarSidebarListItemsProps } from './CalendarSidebarListItems';

jest.mock('@proton/components/containers/calendar/calendarModal/CalendarModal', () => ({
    __esModule: true,
    CalendarModal: jest.fn(() => <span>CalendarModal</span>),
}));

jest.mock('@proton/components/containers/calendar/importModal/ImportModal', () => ({
    __esModule: true,
    default: jest.fn(() => <span>ImportModal</span>),
}));

jest.mock('@proton/components/hooks/useModals', () => ({
    __esModule: true,
    default: jest.fn(() => ({ createModal: jest.fn() })),
}));

jest.mock('@proton/shared/lib/calendar/subscribe/helpers', () => ({
    ...jest.requireActual('@proton/shared/lib/calendar/subscribe/helpers'),
    getCalendarHasSubscriptionParameters: jest.fn(),
    getCalendarIsNotSyncedInfo: jest.fn(),
}));

jest.mock('@proton/shared/lib/calendar/calendar', () => ({
    ...jest.requireActual('@proton/shared/lib/calendar/calendar'),
    getIsCalendarDisabled: jest.fn(),
}));

jest.mock('@proton/components/hooks/useUser', () => ({
    __esModule: true,
    default: jest.fn(() => [{ hasPaidMail: true, hasNonDelinquentScope: true }, false]),
}));

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn(() => ({ APP_NAME: 'proton-calendar' })),
}));

jest.mock('@proton/shared/lib/helpers/setupCryptoWorker', () => ({
    __esModule: true,
    loadCryptoWorker: jest.fn(),
}));

const mockedUseUser = useUser as jest.Mock<ReturnType<typeof useUser>>;
const mockedGetCalendarHasSubscriptionParameters = getCalendarHasSubscriptionParameters as unknown as jest.Mock<
    ReturnType<typeof getCalendarHasSubscriptionParameters>
>;
const mockedGetCalendarIsNotSyncedInfo = getCalendarIsNotSyncedInfo as jest.Mock<
    ReturnType<typeof getCalendarIsNotSyncedInfo>
>;
const mockedGetIsCalendarDisabled = getIsCalendarDisabled as jest.Mock<ReturnType<typeof getIsCalendarDisabled>>;

const mockCalendar: VisualCalendar = {
    ID: 'id3',
    Name: 'calendar3',
    Description: 'description3',
    Display: 1, // CalendarDisplay.VISIBLE
    Color: '#f00',
    Email: 'email3',
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.PERSONAL,
    Members: [],
};

const mockCalendar2: VisualCalendar = {
    ID: 'id2',
    Name: 'calendar2',
    Description: 'description2',
    Display: 1,
    Color: '#f00',
    Email: 'email2',
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.PERSONAL,
    Members: [],
};

const getImportButton = () => screen.queryByText(/Import events/) as HTMLButtonElement;
const getImportModal = () => screen.queryByText(/ImportModal/);

function renderComponent(props?: Partial<CalendarSidebarListItemsProps>) {
    const defaultProps: CalendarSidebarListItemsProps = {
        onChangeVisibility: jest.fn(),
        calendars: [mockCalendar, mockCalendar2],
    };
    return (
        <Router history={createMemoryHistory()}>
            <CacheProvider cache={createCache()}>
                <CalendarSidebarListItems {...defaultProps} {...props} />
            </CacheProvider>
        </Router>
    );
}

describe('CalendarSidebarListItems', () => {
    beforeEach(() => {
        mockedGetIsCalendarDisabled.mockImplementation(() => false);
    });

    it('does not render anything when no calendars are provided', () => {
        const { container } = render(renderComponent({ calendars: [] }));

        expect(container).toBeEmptyDOMElement();
    });

    it('calls display change when hitting the checkbox', () => {
        const mockedOnChangeVisibility = jest.fn();

        render(renderComponent({ onChangeVisibility: mockedOnChangeVisibility }));

        fireEvent.click(screen.getAllByRole(/checkbox/)[0]);

        expect(mockedOnChangeVisibility).toHaveBeenCalledWith(mockCalendar.ID, !mockCalendar.Display);
    });

    it('displays a transparent checkbox background for not displayed calendars', () => {
        const { rerender, container } = render(renderComponent());

        expect(container.querySelector('.checkbox-fakecheck')).toHaveStyle('background-color: #f00');

        rerender(
            renderComponent({
                calendars: [
                    {
                        ...mockCalendar,
                        Display: 0,
                    },
                ],
            })
        );

        expect(container.querySelector('.checkbox-fakecheck')).toHaveStyle('background-color: transparent');
    });

    it('grays and shows additional text for not synced and disabled calendars', () => {
        const getHasWeakColour = () =>
            screen.getAllByTestId('calendar-sidebar:user-calendars')[0].classList.contains('color-weak');
        const { rerender } = render(renderComponent());

        expect(getHasWeakColour()).toBe(false);

        mockedGetIsCalendarDisabled.mockImplementation(() => true);
        rerender(renderComponent());

        expect(screen.getAllByText(/\(\s*Disabled\s*\)/)[0]).toBeInTheDocument();
        expect(getHasWeakColour()).toBe(true);

        mockedGetIsCalendarDisabled.mockImplementation(() => false);
        mockedGetCalendarHasSubscriptionParameters.mockImplementation(() => true);
        mockedGetCalendarIsNotSyncedInfo.mockImplementation(() => ({
            label: 'label',
            text: 'text',
            longText: '',
            isSyncing: false,
        }));
        rerender(renderComponent());

        expect(getHasWeakColour()).toBe(true);
        expect(screen.getAllByText(/\(label\)/)[0]).toBeInTheDocument();

        mockedGetCalendarIsNotSyncedInfo.mockImplementation(() => undefined);
        rerender(renderComponent());

        expect(getHasWeakColour()).toBe(false);
    });

    it('displays the correct dropdown items for personal calendars', async () => {
        render(renderComponent());

        fireEvent.click(screen.getAllByRole('button')[1]);

        const editButton = await screen.findByText(/Edit/);
        const shareLink = screen.getByText(/Share/) as HTMLAnchorElement;
        expect(shareLink).toBeInTheDocument();
        expect(shareLink.href).toBe('http://localhost/calendar/calendars?share=id2');
        const moreOptionsLink = screen.getByText(/More options/) as HTMLAnchorElement;
        expect(moreOptionsLink).toBeInTheDocument();
        expect(moreOptionsLink.href).toBe(`http://localhost/calendar/calendars#${CALENDAR_SETTINGS_SUBSECTION_ID.PERSONAL_CALENDARS}`);
        expect(getImportButton()).toBeInTheDocument();

        const getCalendarModal = () => screen.queryByText(/CalendarModal/);

        expect(getCalendarModal()).not.toBeInTheDocument();
        expect(getImportModal()).not.toBeInTheDocument();

        fireEvent.click(editButton);
        expect(getCalendarModal()).toBeInTheDocument();

        fireEvent.click(getImportButton());
        expect(getImportModal()).toBeInTheDocument();
    });

    it('hidess some dropdown items when calendars are disabled', () => {
        mockedGetIsCalendarDisabled.mockImplementation(() => true);
        render(renderComponent());

        fireEvent.click(screen.getAllByRole('button')[1]);

        expect(screen.getByText(/Edit/)).toBeInTheDocument();
        expect(screen.getByText(/Share/)).toBeInTheDocument();
        expect(screen.getByText(/More options/)).toBeInTheDocument();
        expect(getImportButton()).not.toBeInTheDocument();
    });

    it(`does not open the import modal when user has a delinquent scope`, async () => {
        mockedUseUser.mockImplementation(() => [{ hasNonDelinquentScope: false } as UserModel, false, null]);

        render(renderComponent());

        fireEvent.click(screen.getAllByRole('button')[0]);

        fireEvent.click(getImportButton());

        expect(getImportModal()).not.toBeInTheDocument();
    });

    it('displays the correct dropdown items for subscribed calendars', () => {
        render(
            renderComponent({
                calendars: [
                    {
                        ...mockCalendar,
                        Type: CALENDAR_TYPE.SUBSCRIPTION,
                    },
                ],
            })
        );

        fireEvent.click(screen.getAllByRole('button')[0]);

        expect(screen.getByText(/Edit/)).toBeInTheDocument();
        expect(screen.queryByText(/Share/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Import events/)).not.toBeInTheDocument();
        const moreOptionsLink = screen.getByText(/More options/) as HTMLAnchorElement;
        expect(moreOptionsLink).toBeInTheDocument();
        expect(moreOptionsLink.href).toBe(`http://localhost/calendar/calendars#${CALENDAR_SETTINGS_SUBSECTION_ID.SUBSCRIBED_CALENDARS}`);
    });

    it(`doesn't let you open the dropdown when actions are disabled`, () => {
        render(renderComponent({ actionsDisabled: true }));

        const dropdownButton = screen.getAllByRole('button')[0];

        expect(dropdownButton).toBeDisabled();

        fireEvent.click(dropdownButton);

        expect(screen.queryByText(/Edit/)).not.toBeInTheDocument();
    });
});
