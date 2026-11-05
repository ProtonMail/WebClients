import { useRoomContext } from '@livekit/components-react';
import { render, screen } from '@testing-library/react';
import { ConnectionQuality, type Participant } from 'livekit-client';

import { NetworkQualityIndicator } from './NetworkQualityIndicator';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

const renderIndicator = (connectionQuality: ConnectionQuality) => {
    vi.mocked(useRoomContext).mockReturnValue({ on: vi.fn(), off: vi.fn() } as unknown as ReturnType<
        typeof useRoomContext
    >);

    const participant = { identity: 'participant-1', isLocal: false, connectionQuality } as Participant;

    return render(<NetworkQualityIndicator size={32} participant={participant} />);
};

describe('NetworkQualityIndicator', () => {
    it('exposes the poor connection status as text for screen readers', () => {
        renderIndicator(ConnectionQuality.Poor);

        const label = screen.getByText('Poor connection');

        expect(label).toHaveClass('sr-only');
        expect(label.closest('[aria-hidden="true"]')).toBeNull();
    });

    it.each([ConnectionQuality.Poor, ConnectionQuality.Lost])(
        'shows one signal bar and the poor connection label when the connection is %s',
        (connectionQuality) => {
            renderIndicator(connectionQuality);

            const indicator = screen.getByText('Poor connection').parentElement;

            expect(indicator).toHaveClass('hide-connection-path-2', 'hide-connection-path-3');
        }
    );

    it.each([ConnectionQuality.Good, ConnectionQuality.Excellent])(
        'shows nothing when the connection is %s',
        (connectionQuality) => {
            const { container } = renderIndicator(connectionQuality);

            expect(container).toBeEmptyDOMElement();
        }
    );
});
