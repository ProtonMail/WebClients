import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';

import { UserModel } from '@proton/shared/lib/interfaces';
import createCache from '@proton/shared/lib/helpers/cache';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import CalendarsSection, { CalendarsSectionProps } from './CalendarsSection';

jest.mock('../hooks/useGetCalendarsEmails', () => jest.fn(() => ({})));
jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../../eventManager/calendar/useCalendarsInfoListener', () => () => ({}));
jest.mock('../../eventManager/calendar/ModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(),
}));
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }));

function renderComponent(props?: Partial<CalendarsSectionProps>) {
    const defaultProps: CalendarsSectionProps = {
        calendars: [],
        // defaultCalendarID?: string,
        user: { isFree: true } as UserModel,
        // loading?: boolean,
        loadingMap: {},
        canAdd: false,
        // isFeatureUnavailable?: boolean,
        add: 'add',
        description: 'description',
        onAdd: jest.fn(),
        // onSetDefault?: (id: string) => Promise<void>,
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        // onExport?: (calendar: Calendar) => void,
        canUpgradeLimit: true,
        calendarLimitReachedText: 'calendarLimitReachedText',
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
