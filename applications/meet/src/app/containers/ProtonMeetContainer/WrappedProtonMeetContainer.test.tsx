import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { Room, isE2EESupported } from 'livekit-client';
import type { Mock } from 'vitest';

import { WrappedProtonMeetContainer } from './WrappedProtonMeetContainer';

vi.mock('livekit-client', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    isE2EESupported: vi.fn(),
    Room: vi.fn(),
}));
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: vi.fn() }),
}));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: () => vi.fn() }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
vi.mock('../../components/PageHeader/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('../../utils/meet-audio-context', () => ({
    createMeetAudioContext: () => ({ audioContext: { sampleRate: 48000 }, cleanup: vi.fn() }),
}));

const { Passthrough } = vi.hoisted(() => ({
    Passthrough: ({ children }: { children?: ReactNode }) => children,
}));
vi.mock('./MeetingAnalyticsProvider', () => ({ MeetingAnalyticsProvider: Passthrough }));
vi.mock('../../contexts/SubscriptionManagementProvider', () => ({ SubscriptionManagementProvider: Passthrough }));
vi.mock('@proton/components/components/liveAnnouncer/LiveAnnouncerProvider', () => ({
    LiveAnnouncerProvider: Passthrough,
}));
vi.mock('../../contexts/MediaManagementProvider/MediaManagementProvider', () => ({
    MediaManagementProvider: Passthrough,
}));
vi.mock('../../contexts/ParticipantsProvider/SortedParticipantsProvider', () => ({
    SortedParticipantsProvider: Passthrough,
}));
vi.mock('./ProtonMeetContainer', () => ({ ProtonMeetContainer: () => <div>Call page</div> }));

const isE2EESupportedMock = isE2EESupported as unknown as Mock;
const WorkerMock = vi.fn(function (this: { terminate: () => void }) {
    this.terminate = vi.fn();
});

beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Worker', WorkerMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('WrappedProtonMeetContainer', () => {
    it('shows the unsupported browser state without creating the room or its encryption worker when the browser cannot run end-to-end encryption', () => {
        isE2EESupportedMock.mockReturnValue(false);

        render(<WrappedProtonMeetContainer />);

        expect(screen.getByRole('dialog', { name: 'Can’t join from this browser' })).toBeInTheDocument();
        expect(screen.queryByText('Call page')).not.toBeInTheDocument();
        expect(Room).not.toHaveBeenCalled();
        expect(WorkerMock).not.toHaveBeenCalled();
    });

    it('opens the call page with an encrypted room when the browser can run end-to-end encryption', () => {
        isE2EESupportedMock.mockReturnValue(true);

        render(<WrappedProtonMeetContainer />);

        expect(screen.getByText('Call page')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(Room).toHaveBeenCalledWith(expect.objectContaining({ e2ee: expect.any(Object) }));
    });
});
