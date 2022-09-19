import React from 'react';
import { Router } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import createCache from '@proton/shared/lib/helpers/cache';
import { UserModel } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import CalendarsSection, { CalendarsSectionProps } from './CalendarsSection';

jest.mock('../../../hooks/useAddresses', () => ({
    __esModule: true,
    default: jest.fn(() => [
        [
            {
                Email: 'test@pm.gg',
                Status: 1,
                Receive: 1,
                Send: 1,
            },
        ],
    ]),
    useGetAddresses: jest.fn(),
}));
jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(),
}));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));
jest.mock('@proton/components/hooks/useAddresses', () => ({
    __esModule: true,
    default: jest.fn(() => [
        [
            {
                Email: 'test@pm.gg',
                Status: 1,
                Receive: 1,
                Send: 1,
            },
        ],
    ]),
    useGetAddresses: jest.fn(),
}));

function renderComponent(props?: Partial<CalendarsSectionProps>) {
    const defaultProps: CalendarsSectionProps = {
        calendars: [],
        // defaultCalendarID?: string,
        user: { hasPaidMail: false } as UserModel,
        // loading?: boolean,
        canAdd: true,
        // isFeatureUnavailable?: boolean,
        add: 'add',
        description: 'description',
        onAdd: jest.fn(),
        // onSetDefault?: (id: string) => Promise<void>,
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        // onExport?: (calendar: Calendar) => void,
        canUpgradeCalendarsLimit: true,
        calendarsLimitReachedText: 'calendarLimitReachedText',
    };

    return (
        <ModalsProvider>
            <Router history={createMemoryHistory()}>
                <CacheProvider cache={createCache()}>
                    <CalendarsSection {...defaultProps} {...props} />
                </CacheProvider>
            </Router>
        </ModalsProvider>
    );
}

describe('CalendarsSection', () => {
    it('renders properly', () => {
        render(renderComponent({ calendars: [{ ID: '1', Name: 'calendar1' } as VisualCalendar] }));

        expect(screen.getByText('calendar1')).toBeInTheDocument();
        expect(screen.getByText('description')).toBeInTheDocument();
        expect(screen.getByText('add')).toBeInTheDocument();
    });

    it('does not render a table when no calendars are provided', () => {
        render(renderComponent());

        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
});
