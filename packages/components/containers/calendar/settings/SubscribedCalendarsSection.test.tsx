import React from 'react';
import { Router } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { MAX_SUBSCRIBED_CALENDARS } from '@proton/shared/lib/calendar/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar';

import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import SubscribedCalendarsSection, { SubscribedCalendarsSectionProps } from './SubscribedCalendarsSection';

jest.mock('../../../hooks/useApi', () => () => jest.fn(() => Promise.resolve({})));
jest.mock('../../../hooks/useEarlyAccess', () => () => ({}));
jest.mock('../../../hooks/useFeatures', () => () => ({}));
jest.mock('../../../hooks/useSubscribedCalendars', () => jest.fn(() => ({ loading: true })));
jest.mock('../../../hooks/useEventManager', () => jest.fn(() => ({ subscribe: jest.fn() })));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ subscribe: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/components/hooks/useCalendarSubscribeFeature', () =>
    jest.fn(() => ({ enabled: true, unavailable: false }))
);

function renderComponent(props?: Partial<SubscribedCalendarsSectionProps>) {
    const defaultProps: SubscribedCalendarsSectionProps = {
        addresses: [{ Status: 1, Receive: 1, Send: 1 }] as Address[],
        calendars: [],
        user: { isFree: true, hasNonDelinquentScope: true } as UserModel,
    };

    return (
        <ModalsProvider>
            <Router history={createMemoryHistory()}>
                <CacheProvider cache={createCache()}>
                    <SubscribedCalendarsSection {...defaultProps} {...props} />
                </CacheProvider>
            </Router>
        </ModalsProvider>
    );
}

describe('SubscribedCalendarsSection', () => {
    it('displays the calendar limit warning when the limit is reached', () => {
        const calendars = Array(MAX_SUBSCRIBED_CALENDARS)
            .fill(1)
            .map((_, index) => ({
                ID: `${index}`,
                Name: `calendar${index}`,
                color: '#f00',
            })) as unknown as SubscribedCalendar[];

        const { rerender } = render(
            renderComponent({
                calendars,
            })
        );

        const maxReachedCopy = `You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS} subscribed calendars.`;
        const createCalendarCopy = 'Add calendar';

        expect(screen.getByText(maxReachedCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        rerender(renderComponent());

        expect(screen.queryByText(maxReachedCopy)).not.toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).not.toBeDisabled();
    });
});
