import { Router } from 'react-router';

import { render } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import {
    ADDRESS_RECEIVE,
    ADDRESS_SEND,
    ADDRESS_STATUS,
    BRAND_NAME,
    MAIL_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { RequireOnly, UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import {
    addressBuilder,
    generateOwnedPersonalCalendars,
    generateSharedCalendars,
    generateSubscribedCalendars,
} from '@proton/testing/lib/builders';

import { IconName } from '../../../components';
import CalendarsSettingsSection, { CalendarsSettingsSectionProps } from './CalendarsSettingsSection';

jest.mock('../../../hooks/useCalendarShareInvitations', () =>
    jest.fn().mockReturnValue({
        loading: false,
        invitations: [],
    })
);
jest.mock('../../../hooks/useCalendarShareInvitationActions', () =>
    jest.fn().mockReturnValue({
        accept: () => {},
        reject: () => {},
    })
);
jest.mock('../../../hooks/useConfig', () => () => ({
    CLIENT_TYPE: 1,
    CLIENT_SECRET: 'not_so_secret',
    APP_VERSION: 'test',
    APP_NAME: 'proton-calendar',
    API_URL: 'api',
    LOCALES: {},
    DATE_VERSION: 'test',
    COMMIT: 'test',
    BRANCH: 'test',
    SENTRY_DSN: 'test',
    VERSION_PATH: 'test',
}));
jest.mock('../../../hooks/useAppTitle', () => jest.fn().mockReturnValue(undefined));
jest.mock('../../../hooks/useApi', () => jest.fn(() => jest.fn().mockResolvedValue({})));

jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ call: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/components/hooks/useFeature', () => jest.fn(() => ({ feature: { Value: true } })));
jest.mock('@proton/components/hooks/useEarlyAccess', () => () => ({}));

let memoryHistory = createMemoryHistory();

const renderComponent = ({
    user,
    addresses = [addressBuilder()],
    calendars,
    myCalendars,
    subscribedCalendars,
    sharedCalendars,
    unknownCalendars = [],
    calendarSubscribeUnavailable = false,
}: RequireOnly<
    CalendarsSettingsSectionProps,
    'user' | 'calendars' | 'myCalendars' | 'sharedCalendars' | 'subscribedCalendars'
>) => {
    const config = {
        icon: 'calendar' as IconName,
        to: '/calendars',
        text: 'Calendars',
        subsections: [
            { text: 'My calendars', id: 'my-calendars' },
            { text: 'Other calendars', id: 'other-calendars' },
        ],
    };

    return render(
        <Router history={memoryHistory}>
            <CalendarsSettingsSection
                config={config}
                user={user}
                addresses={addresses}
                calendars={calendars}
                myCalendars={myCalendars}
                subscribedCalendars={subscribedCalendars}
                sharedCalendars={sharedCalendars}
                unknownCalendars={unknownCalendars}
                calendarSubscribeUnavailable={calendarSubscribeUnavailable}
            />
        </Router>
    );
};

describe('My calendars section', () => {
    const createCalendarText = `Create calendar`;
    const addCalendarText = `Add calendar`;
    const limitReachedFreeText = `You've reached the maximum number of calendars available in your plan. To add a new calendar, remove another calendar or upgrade your ${BRAND_NAME} plan to a ${MAIL_SHORT_APP_NAME} paid plan.`;
    const limitReachedPaidText = `You've reached the maximum number of calendars available in your plan. To add a new calendar, remove an existing one.`;

    describe('for a Mail free user', () => {
        it('allows the user to create both personal and other calendars if under the limit', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars: VisualCalendar[] = [];
            const subscribedCalendars = generateSubscribedCalendars(1);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(queryAllByText(limitReachedFreeText)).toHaveLength(0);
            expect(queryAllByText(createCalendarText)).toHaveLength(1);
            expect(queryAllByText(addCalendarText)).toHaveLength(1);
        });

        it('displays the limit reached message in both "My calendars" and "Other calendars" section when the user reaches the calendar limit with personal owned calendars', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(MAX_CALENDARS_FREE);
            const sharedCalendars: VisualCalendar[] = [];
            const subscribedCalendars: SubscribedCalendar[] = [];
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(queryAllByText(limitReachedFreeText)).toHaveLength(2);
            expect(queryAllByText(createCalendarText)).toHaveLength(0);
            expect(queryAllByText(addCalendarText)).toHaveLength(0);
        });

        it('displays the limit reached message only in "Other calendars" section when the user reached the calendar limit with shared and subscribed calendars (only possible for pre-plans-migration users), and allows creation of owned personal calendars', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars = generateSharedCalendars(MAX_CALENDARS_FREE - 2);
            const subscribedCalendars = generateSubscribedCalendars(2);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(queryAllByText(limitReachedFreeText)).toHaveLength(1);
            expect(queryAllByText(createCalendarText)).toHaveLength(1);
        });

        it('prevents user from creating MAX_CALENDARS_FREE other calendars by displaying limit reached message', () => {
            const user = { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars = generateSharedCalendars(1);
            const subscribedCalendars = generateSubscribedCalendars(MAX_CALENDARS_FREE - 2);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(queryAllByText(limitReachedFreeText)).toHaveLength(1);
            expect(queryAllByText(createCalendarText)).toHaveLength(1);
            expect(queryAllByText(addCalendarText)).toHaveLength(0);
        });

        it('prevents user without active addresses from creating personal or other calendars', () => {
            const user = { isFree: true, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel;
            const addresses = [
                {
                    ...addressBuilder(),
                    Receive: ADDRESS_RECEIVE.RECEIVE_NO,
                    Send: ADDRESS_SEND.SEND_NO,
                    Status: ADDRESS_STATUS.STATUS_DISABLED,
                },
            ];

            const myCalendars = generateOwnedPersonalCalendars(0);
            const sharedCalendars = generateSharedCalendars(0);
            const subscribedCalendars = generateSubscribedCalendars(0);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { getByText, queryAllByText } = renderComponent({
                user,
                addresses,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = getByText(createCalendarText);
            const addCalendarButton = getByText(addCalendarText);

            expect(queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
        });

        it('prevents delinquent user from creating personal or other calendars', () => {
            const user = { isFree: true, hasPaidMail: false, hasNonDelinquentScope: false } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(0);
            const sharedCalendars = generateSharedCalendars(0);
            const subscribedCalendars = generateSubscribedCalendars(0);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { getByText, queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = getByText(createCalendarText);
            const addCalendarButton = getByText(addCalendarText);

            expect(queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
        });
    });

    describe('for a Mail paid user', () => {
        it('allows the user to create both personal and other calendars if under the limit', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(7);
            const sharedCalendars = generateSharedCalendars(4);
            const subscribedCalendars = generateSubscribedCalendars(5);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(queryAllByText(limitReachedFreeText)).toHaveLength(0);
            expect(queryAllByText(createCalendarText)).toHaveLength(1);
            expect(queryAllByText(addCalendarText)).toHaveLength(1);
        });

        it('displays the limit reached message in both "My calendars" and "Other calendars" section when the user reaches the calendar limit with personal owned calendars', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(MAX_CALENDARS_PAID);
            const sharedCalendars: VisualCalendar[] = [];
            const subscribedCalendars: SubscribedCalendar[] = [];
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(queryAllByText(limitReachedPaidText)).toHaveLength(2);
            expect(queryAllByText(createCalendarText)).toHaveLength(0);
            expect(queryAllByText(addCalendarText)).toHaveLength(0);
        });

        it('prevents user from creating MAX_CALENDARS_PAID other calendars by display limit reached message', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;

            const myCalendars: VisualCalendar[] = [];
            const sharedCalendars = generateSharedCalendars(MAX_CALENDARS_PAID - 2);
            const subscribedCalendars = generateSubscribedCalendars(1);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            expect(queryAllByText(limitReachedPaidText)).toHaveLength(1);
            expect(queryAllByText(createCalendarText)).toHaveLength(1);
            expect(queryAllByText(addCalendarText)).toHaveLength(0);
        });

        it('prevents user without active addresses from creating personal or other calendars', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel;
            const addresses = [
                {
                    ...addressBuilder(),
                    Receive: ADDRESS_RECEIVE.RECEIVE_NO,
                    Send: ADDRESS_SEND.SEND_NO,
                    Status: ADDRESS_STATUS.STATUS_DISABLED,
                },
            ];

            const myCalendars = generateOwnedPersonalCalendars(2);
            const sharedCalendars = generateSharedCalendars(0);
            const subscribedCalendars = generateSubscribedCalendars(0);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { getByText, queryAllByText } = renderComponent({
                user,
                addresses,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = getByText(createCalendarText);
            const addCalendarButton = getByText(addCalendarText);

            expect(queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
        });

        it('prevents delinquent user from creating personal or other calendars', () => {
            const user = { isFree: false, hasPaidMail: true, hasNonDelinquentScope: false } as UserModel;

            const myCalendars = generateOwnedPersonalCalendars(1);
            const sharedCalendars = generateSharedCalendars(1);
            const subscribedCalendars = generateSubscribedCalendars(1);
            const calendars = [...myCalendars, ...sharedCalendars, ...subscribedCalendars];

            const { getByText, queryAllByText } = renderComponent({
                user,
                calendars,
                myCalendars,
                sharedCalendars,
                subscribedCalendars,
            });

            const createCalendarButton = getByText(createCalendarText);
            const addCalendarButton = getByText(addCalendarText);

            expect(queryAllByText(limitReachedPaidText)).toHaveLength(0);
            expect(createCalendarButton).toBeInTheDocument();
            expect(createCalendarButton).toBeDisabled();
            expect(addCalendarButton).toBeInTheDocument();
            expect(addCalendarButton).toBeDisabled();
        });
    });
});
