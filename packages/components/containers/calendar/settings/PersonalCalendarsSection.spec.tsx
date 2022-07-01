import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';

import createCache from '@proton/shared/lib/helpers/cache';

import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import PersonalCalendarsSection, { PersonalCalendarsSectionProps } from './PersonalCalendarsSection';

jest.mock('../../../hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(() => jest.fn().mockResolvedValue({})),
}));

jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../hooks/useGetCalendarsEmails', () => jest.fn(() => ({})));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ call: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/components/hooks/useFeature', () => jest.fn(() => ({ feature: { Value: true } })));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));
jest.mock('@proton/components/hooks/useEarlyAccess', () => () => ({}));

function renderComponent(props?: Partial<PersonalCalendarsSectionProps>) {
    const defaultProps: PersonalCalendarsSectionProps = {
        addresses: [{ Status: 1, Receive: 1, Send: 1 }] as Address[],
        calendars: [],
        activeCalendars: [],
        // defaultCalendar?: Calendar;
        user: { isFree: true, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel,
    };

    return (
        <ModalsProvider>
            <Router history={createMemoryHistory()}>
                <CacheProvider cache={createCache()}>
                    <PersonalCalendarsSection {...defaultProps} {...props} />
                </CacheProvider>
            </Router>
        </ModalsProvider>
    );
}

describe('PersonalCalendarsSection', () => {
    it('displays the calendar limit warning when the limit is reached', () => {
        const calendarsFree = Array(MAX_CALENDARS_FREE)
            .fill(1)
            .map((_, index) => ({
                ID: `${index}`,
                Name: `calendar${index}`,
                color: '#f00',
            })) as unknown as VisualCalendar[];
        const calendarsPaid = Array(MAX_CALENDARS_PAID)
            .fill(1)
            .map((_, index) => ({
                ID: `${index}`,
                Name: `calendar${index}`,
                color: '#f00',
            })) as unknown as VisualCalendar[];

        const { rerender } = render(
            renderComponent({
                calendars: calendarsFree,
            })
        );
        const createCalendarCopy = 'Create calendar';

        // Free user reached limit
        expect(
            screen.getByText(
                /You have reached the maximum number of personal calendars you can create within your plan./
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        // Free user with extra calendars due to EasySwitch
        rerender(
            renderComponent({
                calendars: calendarsPaid,
                user: { isFree: true, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel,
            })
        );
        expect(
            screen.getByText(
                /You have reached the maximum number of personal calendars you can create within your plan./
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        // Paid VPN user with no Mail can only create one calendar
        rerender(
            renderComponent({
                calendars: calendarsFree,
                user: { isFree: false, hasPaidMail: false, hasNonDelinquentScope: true } as UserModel,
            })
        );
        expect(
            screen.getByText(
                /You have reached the maximum number of personal calendars you can create within your plan./
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `Upgrade to a Mail paid plan to create up to ${MAX_CALENDARS_PAID} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        // Paid user reached limit
        rerender(
            renderComponent({
                calendars: calendarsPaid,
                user: { isFree: false, hasPaidMail: true, hasNonDelinquentScope: true } as UserModel,
            })
        );

        expect(
            screen.getByText(
                `You have reached the maximum number of personal calendars you can create within your plan.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        // Delinquent paid user reached limit
        rerender(
            renderComponent({
                calendars: calendarsPaid,
                user: { isFree: false, hasPaidMail: true, hasNonDelinquentScope: false } as UserModel,
            })
        );

        expect(
            screen.queryByText(
                `You have reached the maximum number of personal calendars you can create within your plan.`
            )
        ).not.toBeInTheDocument();

        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        // Free user without calendars
        rerender(renderComponent());

        expect(
            screen.queryByText(
                `You have reached the maximum number of personal calendars you can create within your plan.`
            )
        ).not.toBeInTheDocument();
        expect(screen.queryByText(createCalendarCopy)).not.toBeDisabled();
    });
});
