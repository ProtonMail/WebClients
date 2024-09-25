import { Router } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { CacheProvider } from '@proton/components';
import useUser from '@proton/components/hooks/useUser';
import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_FLAGS, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import createCache from '@proton/shared/lib/helpers/cache';
import type { Address, UserModel } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { mockUseAuthentication } from '@proton/testing/lib/mockUseAuthentication';

import type { CalendarSidebarListItemsProps } from './CalendarSidebarListItems';
import CalendarSidebarListItems from './CalendarSidebarListItems';

jest.mock('@proton/components/containers/calendar/calendarModal/personalCalendarModal/PersonalCalendarModal', () => ({
    __esModule: true,
    PersonalCalendarModal: jest.fn(() => <span>PersonalCalendarModal</span>),
    // It's not great having to mock this export manually, but the only alternative would be
    // to move the enum definition somewhere else. Ideally we shouldn't mock PersonalCalendarModal at all
    CALENDAR_MODAL_TYPE: {
        COMPLETE: 0,
        SHARED: 1,
        VISUAL: 2,
    },
}));

jest.mock('@proton/components/containers/calendar/importModal/ImportModal', () => ({
    __esModule: true,
    default: jest.fn(() => <span>ImportModal</span>),
}));

jest.mock('@proton/components/hooks/useModals', () => ({
    __esModule: true,
    default: jest.fn(() => ({ createModal: jest.fn() })),
}));

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: () => jest.fn(() => Promise.resolve([])),
}));

jest.mock('@proton/features/useFeature', () => () => ({ feature: { Value: true } }));

jest.mock('@proton/components/hooks/useNotifications', () => () => ({ createNotification: jest.fn() }));

jest.mock('@proton/components/containers/contacts/ContactEmailsProvider', () => ({
    __esModule: true,
    useContactEmailsCache: jest.fn(() => ({
        contactEmails: [],
        contactGroups: [],
        contactEmailsMap: {},
        groupsWithContactsMap: {},
    })),
    default: ({ children }: any) => <>{children}</>,
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
    useGetUser: jest.fn(() => [{ hasPaidMail: true, hasNonDelinquentScope: true }, false]),
}));

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn(() => ({ APP_NAME: 'proton-calendar' })),
}));

jest.mock('@proton/components/hooks/useGetEncryptionPreferences', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/hooks/useAddressesKeys', () => ({
    __esModule: true,
    useGetAddressKeys: jest.fn(),
}));

jest.mock('@proton/components/hooks/useAddresses', () => ({
    __esModule: true,
    useGetAddresses: jest.fn(),
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
    ID: 'id1',
    Name: 'calendar1',
    Description: 'description1',
    Display: 1, // CalendarDisplay.VISIBLE
    Color: '#f00',
    Email: 'email1',
    Permissions: MEMBER_PERMISSIONS.OWNS,
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.PERSONAL,
    Owner: { Email: 'email1' },
    Priority: 1,
    Members: [
        {
            Email: 'email1',
            Permissions: 127,
            AddressID: 'AddressID',
            Display: 1,
            ID: 'ID',
            Flags: 1,
            Color: '#f00',
            CalendarID: 'id1',
            Name: 'calendar1',
            Description: 'description1',
            Priority: 1,
        },
    ],
};

const mockCalendar2: VisualCalendar = {
    ID: 'id2',
    Name: 'calendar2',
    Description: 'description2',
    Display: 1,
    Color: '#f00',
    Email: 'email2',
    Permissions: MEMBER_PERMISSIONS.OWNS,
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.PERSONAL,
    Owner: { Email: 'email2' },
    Priority: 2,
    Members: [
        {
            Email: 'email2',
            Permissions: 127,
            AddressID: 'AddressID',
            Display: 1,
            ID: 'ID',
            Flags: 1,
            Color: '#f00',
            CalendarID: 'id2',
            Name: 'calendar2',
            Description: 'description2',
            Priority: 2,
        },
    ],
};

const mockSharedCalendar: VisualCalendar = {
    ID: 'id3',
    Name: 'calendar3',
    Description: 'description3',
    Display: 1, // CalendarDisplay.VISIBLE
    Color: '#f00',
    Email: 'email3',
    Permissions: MEMBER_PERMISSIONS.FULL_VIEW,
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.PERSONAL,
    Owner: { Email: 'email1' },
    Priority: 3,
    Members: [
        {
            Email: 'email3',
            Permissions: 127,
            AddressID: 'AddressID',
            Display: 1,
            ID: 'ID',
            Flags: 1,
            Color: '#f00',
            CalendarID: 'id3',
            Name: 'calendar3',
            Description: 'description3',
            Priority: 3,
        },
    ],
};

const mockSubscribedCalendar: VisualCalendar = {
    ID: 'id4',
    Name: 'calendar4',
    Description: 'description4',
    Display: 1,
    Color: '#f00',
    Email: 'email4',
    Permissions: MEMBER_PERMISSIONS.OWNS,
    Flags: CALENDAR_FLAGS.ACTIVE,
    Type: CALENDAR_TYPE.SUBSCRIPTION,
    Owner: { Email: 'email4' },
    Priority: 4,
    Members: [
        {
            Email: 'email4',
            Permissions: 127,
            AddressID: 'AddressID',
            Display: 1,
            ID: 'ID',
            Flags: 1,
            Color: '#f00',
            CalendarID: 'id4',
            Name: 'calendar4',
            Description: 'description4',
            Priority: 4,
        },
    ],
};

const getImportButton = () => screen.queryByText(/Import events/) as HTMLButtonElement;
const getImportModal = () => screen.queryByText(/ImportModal/);

let memoryHistory = createMemoryHistory();

function renderComponent(props?: Partial<CalendarSidebarListItemsProps>) {
    const defaultProps: CalendarSidebarListItemsProps = {
        onChangeVisibility: jest.fn(),
        calendars: [mockCalendar, mockCalendar2],
        allCalendars: [mockCalendar, mockCalendar2],
        addresses: [
            {
                Email: 'test@pm.gg',
                Status: 1,
                Receive: 1,
                Send: 1,
            } as Address,
        ],
    };
    mockUseAuthentication({} as any);
    return (
        <Router history={memoryHistory}>
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

        fireEvent.click(screen.getAllByRole('checkbox')[0]);

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
            longText: 'text.',
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
        const shareButton = screen.getByText(/Share/) as HTMLAnchorElement;
        expect(shareButton).toBeInTheDocument();
        fireEvent.click(shareButton);
        expect(screen.getByText(/Share with Proton users/)).toBeInTheDocument();
        const shareWithAnyoneButton = screen.getByText(/Share with anyone/);
        expect(shareWithAnyoneButton).toBeInTheDocument();
        const moreOptionsLink = screen.getByText(/More options/) as HTMLAnchorElement;
        expect(moreOptionsLink).toBeInTheDocument();
        expect(moreOptionsLink.href).toBe(`http://localhost/calendar/calendars/id2`);
        expect(getImportButton()).toBeInTheDocument();

        const getCalendarModal = () => screen.queryByText(/PersonalCalendarModal/);

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
        mockedUseUser.mockImplementation(() => [{ hasNonDelinquentScope: false } as UserModel, false]);

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
        expect(moreOptionsLink.href).toBe(`http://localhost/calendar/calendars/id1`);
    });

    it('displays the correct dropdown items for shared calendars', () => {
        render(
            renderComponent({
                calendars: [mockCalendar, mockSharedCalendar],
            })
        );

        fireEvent.click(screen.getAllByRole('button')[1]);

        expect(screen.getByText(/Edit/)).toBeInTheDocument();
        expect(screen.queryByText(/Share/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Import events/)).not.toBeInTheDocument();
        const moreOptionsLink = screen.getByText(/More options/) as HTMLAnchorElement;
        expect(moreOptionsLink).toBeInTheDocument();
        expect(moreOptionsLink.href).toBe(`http://localhost/calendar/calendars/id3`);
    });

    it(`doesn't let you open the dropdown for a subscribed calendar when loading subscription parameters`, () => {
        render(renderComponent({ calendars: [mockSubscribedCalendar], loadingSubscriptionParameters: true }));

        const dropdownButton = screen.getAllByRole('button')[0];

        expect(dropdownButton).toBeDisabled();

        fireEvent.click(dropdownButton);

        expect(screen.queryByText(/Edit/)).not.toBeInTheDocument();
    });

    it('lets you open the dropdown for a subscribed calendar when loading subscription parameters', () => {
        render(renderComponent({ loadingSubscriptionParameters: true }));

        const dropdownButton = screen.getAllByRole('button')[0];

        expect(dropdownButton).not.toBeDisabled();

        fireEvent.click(dropdownButton);

        expect(screen.queryByText(/Edit/)).toBeInTheDocument();
    });
});
