import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';

import createCache from '@proton/shared/lib/helpers/cache';

import { MAX_SUBSCRIBED_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import SubscribedCalendarsSection, { SubscribedCalendarsSectionProps } from './SubscribedCalendarsSection';

jest.mock('../../../hooks/useApi', () => () => jest.fn(() => Promise.resolve({})));
jest.mock('../hooks/useGetCalendarsEmails', () => jest.fn(() => ({})));
jest.mock('../../../hooks/useSubscribedCalendars', () => jest.fn(() => ({ loading: true })));
jest.mock('../../../hooks/useEventManager', () => jest.fn(() => ({ subscribe: jest.fn() })));
jest.mock('../../eventManager/calendar/useCalendarsKeysSettingsListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({ subscribe: jest.fn() })),
}));
jest.mock('@proton/components/hooks/useNotifications', () => () => ({}));
jest.mock('@proton/components/hooks/useCalendarSubscribeFeature', () =>
    jest.fn(() => ({ enabled: true, unavailable: false }))
);

function renderComponent(props?: Partial<SubscribedCalendarsSectionProps>) {
    const defaultProps: SubscribedCalendarsSectionProps = {
        activeAddresses: [{}] as Address[],
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
        const calendars = Array(MAX_SUBSCRIBED_CALENDARS_PER_USER)
            .fill(1)
            .map((_, index) => ({
                ID: `${index}`,
                Name: `calendar${index}`,
                color: '#f00',
            })) as unknown as Calendar[];

        const { rerender } = render(
            renderComponent({
                calendars,
            })
        );

        const maxReachedCopy = `You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS_PER_USER} subscribed calendars.`;
        const createCalendarCopy = 'Subscribe to calendar';

        expect(screen.getByText(maxReachedCopy)).toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).toBeDisabled();

        rerender(renderComponent());

        expect(screen.queryByText(maxReachedCopy)).not.toBeInTheDocument();
        expect(screen.getByText(createCalendarCopy)).not.toBeDisabled();
    });
});
