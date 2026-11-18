import { Router } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import createCache from '@proton/shared/lib/helpers/cache';
import { generateSimpleCalendar } from '@proton/shared/testing/calendarBuilders';

import { mockUseAuthentication } from '../../../testing/vitest/mockUseAuthentication';
import { CacheProvider } from '../../cache/Provider';
import ModalsProvider from '../../modals/Provider';
import type { CalendarsSectionProps } from './CalendarsSection';
import CalendarsSection from './CalendarsSection';

vi.mock('@proton/account/addresses/hooks', () => ({
    __esModule: true,
    default: vi.fn(() => [
        [
            {
                Email: 'test@pm.gg',
                Status: 1,
                Receive: 1,
                Send: 1,
            },
        ],
    ]),
    useGetAddresses: vi.fn(),
}));
vi.mock('../../../hooks/useEventManager', () => ({ __esModule: true, default: () => ({}) }));
vi.mock('../../eventManager/calendar/useCalendarsInfoListener', () => ({ useCalendarsInfoListener: () => ({}) }));
vi.mock('../../eventManager/calendar/CalendarModelEventManagerProvider', () => ({
    useCalendarModelEventManager: vi.fn(),
}));
vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({ APP_NAME: 'proton-calendar', APP_VERSION: 'test' }),
}));
vi.mock('@proton/account/addresses/hooks', () => ({
    __esModule: true,
    default: vi.fn(() => [
        [
            {
                Email: 'test@pm.gg',
                Status: 1,
                Receive: 1,
                Send: 1,
            },
        ],
    ]),
    useGetAddresses: vi.fn(),
}));

function renderComponent(props?: Partial<CalendarsSectionProps>) {
    const defaultProps: CalendarsSectionProps = {
        addresses: [],
        calendars: [],
        children: null,
        // defaultCalendarID?: string,
        // loading?: boolean,
        // onSetDefault?: (id: string) => Promise<void>,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        // onExport?: (calendar: Calendar) => void,
    };

    mockUseAuthentication({ mode: '' } as any);

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
