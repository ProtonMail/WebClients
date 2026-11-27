import { render, screen } from '@testing-library/react';

import noop from '@proton/utils/noop';

import PassEventsTable from './PassEventsTable';
import type { PassEvent } from './interface';

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));

const buildEvent = (appVersion?: string): PassEvent => ({
    time: '2026-10-16T09:34:51',
    user: { name: 'Admin', email: 'admin@example.com' },
    eventType: 'ItemCreated',
    eventTypeName: 'Item created',
    ip: '127.0.0.1',
    appVersion,
});

const renderTable = (events: PassEvent[]) =>
    render(
        <PassEventsTable
            events={events}
            loading={false}
            onEventClick={noop}
            onTimeClick={noop}
            onEmailOrIpClick={noop}
            onToggleSort={noop}
        />
    );

describe('PassEventsTable', () => {
    it('shows the app and its version on one line in the device column', () => {
        renderTable([buildEvent('browser-pass@1.17.2')]);

        expect(screen.getByText('browser-pass@1.17.2')).toBeInTheDocument();
    });

    it('shows the app on its own when no version is attached', () => {
        renderTable([buildEvent('browser-pass')]);

        expect(screen.getByText('browser-pass')).toBeInTheDocument();
    });

    it('falls back to a placeholder on events that carry no app version', () => {
        renderTable([buildEvent(), buildEvent('')]);

        const deviceCells = screen
            .getAllByRole('row')
            .slice(1)
            .map((row) => row.querySelectorAll('td')[3]?.textContent);
        expect(deviceCells).toEqual(['-', '-']);
    });

    it('keeps the device column next to the other columns', () => {
        renderTable([buildEvent('browser-pass@1.17.2')]);

        const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
        expect(headers).toEqual(['User', 'Event', 'Details', 'Device', 'IP']);
    });
});
