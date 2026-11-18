import { renderHook } from '@testing-library/react';

import { AnnouncementPriority } from '@proton/components/components/liveAnnouncer/types';

import type { ConnectionStatus } from '../../../hooks/useConnectionStatus/useConnectionStatus';
import { useConnectionAnnouncements } from './useConnectionAnnouncements';

const announce = vi.fn();

vi.mock('@proton/components/components/liveAnnouncer/useAnnounce', () => ({ useAnnounce: () => announce }));

const renderAnnouncements = (initialPhase: ConnectionStatus['phase'] = 'connected') =>
    renderHook((phase: ConnectionStatus['phase']) => useConnectionAnnouncements(phase), {
        initialProps: initialPhase,
    });

const announcedMessages = () => announce.mock.calls.map(([message]) => message);

describe('useConnectionAnnouncements', () => {
    beforeEach(() => {
        announce.mockClear();
    });

    it('does not announce the phase it starts in', () => {
        renderAnnouncements('reconnecting');

        expect(announce).not.toHaveBeenCalled();
    });

    it('announces the connection loss and the recovery, but not the return to connected', () => {
        const { rerender } = renderAnnouncements();

        rerender('reconnecting');
        rerender('reconnected');
        rerender('connected');

        expect(announcedMessages()).toEqual(['Connection lost. Reconnecting…', 'Reconnected']);
    });

    it('announces the disconnection when reconnecting fails', () => {
        const { rerender } = renderAnnouncements();

        rerender('reconnecting');
        rerender('disconnected');

        expect(announcedMessages()).toEqual(['Connection lost. Reconnecting…', 'Disconnected from the meeting']);
    });

    it('announces a phase once while it lasts', () => {
        const { rerender } = renderAnnouncements();

        rerender('reconnecting');
        rerender('reconnecting');

        expect(announcedMessages()).toEqual(['Connection lost. Reconnecting…']);
    });

    it('announces with high priority', () => {
        const { rerender } = renderAnnouncements();

        rerender('reconnecting');
        rerender('reconnected');

        expect(announce).toHaveBeenCalledWith(
            'Connection lost. Reconnecting…',
            expect.objectContaining({ priority: AnnouncementPriority.High })
        );
        expect(announce).toHaveBeenCalledWith(
            'Reconnected',
            expect.objectContaining({ priority: AnnouncementPriority.High })
        );
    });
});
