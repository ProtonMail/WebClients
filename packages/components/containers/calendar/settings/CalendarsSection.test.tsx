import { Router } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import createCache from '@proton/shared/lib/helpers/cache';
import { UserModel } from '@proton/shared/lib/interfaces';
import { generateSimpleCalendar } from '@proton/testing/lib/builders';

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
        addresses: [],
        calendars: [],
        children: null,
        // defaultCalendarID?: string,
        user: { hasPaidMail: false } as UserModel,
        // loading?: boolean,
        // onSetDefault?: (id: string) => Promise<void>,
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        // onExport?: (calendar: Calendar) => void,
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
        render(
            renderComponent({
                calendars: [generateSimpleCalendar(1, { name: 'calendar1' })],
            })
        );

        expect(screen.getByText('calendar1')).toBeInTheDocument();
    });

    it('does not render a table when no calendars are provided', () => {
        render(renderComponent());

        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
});
