import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';

import createCache from '@proton/shared/lib/helpers/cache';

import { MAX_CALENDARS_PER_FREE_USER, MAX_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import PersonalCalendarsSection, { PersonalCalendarsSectionProps } from './PersonalCalendarsSection';

jest.mock('../../../hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(() => jest.fn().mockResolvedValue({})),
}));

jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../hooks/useGetCalendarsEmails', () => jest.fn(() => ({})));
jest.mock('../../eventManager/calendar/useCalendarsKeysSettingsListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ call: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/components/hooks/useFeature', () => jest.fn(() => ({ feature: { Value: true } })));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));
jest.mock('@proton/components/hooks/useEarlyAccess', () => () => ({}));

function renderComponent(props?: Partial<PersonalCalendarsSectionProps>) {
    const defaultProps: PersonalCalendarsSectionProps = {
        activeAddresses: [{}] as Address[],
        calendars: [],
        activeCalendars: [],
        // defaultCalendar?: Calendar;
        user: { isFree: true, hasNonDelinquentScope: true } as UserModel,
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
        const calendarsFree = Array(MAX_CALENDARS_PER_FREE_USER)
            .fill(1)
            .map((_, index) => ({
                ID: `${index}`,
                Name: `calendar${index}`,
                color: '#f00',
            })) as unknown as Calendar[];
        const calendarsPaid = Array(MAX_CALENDARS_PER_USER)
            .fill(1)
            .map((_, index) => ({
                ID: `${index}`,
                Name: `calendar${index}`,
                color: '#f00',
            })) as unknown as Calendar[];

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
                `Upgrade to a paid plan to create up to ${MAX_CALENDARS_PER_USER} calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`
            )
        ).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        // Paid user reached limit
        rerender(
            renderComponent({
                calendars: calendarsPaid,
                user: { isFree: false, hasNonDelinquentScope: true } as UserModel,
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
                user: { isFree: false, hasNonDelinquentScope: false } as UserModel,
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
