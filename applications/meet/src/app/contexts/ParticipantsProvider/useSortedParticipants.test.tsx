import { useParticipants, useRoomContext } from '@livekit/components-react';
import { act, renderHook } from '@testing-library/react';
import type { LocalParticipant, RemoteParticipant, Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMeetSelector } from '@proton/meet/store/hooks';

import { useSortedParticipants } from './useSortedParticipants';

// Mock dependencies
vi.mock('@livekit/components-react', () => ({
    useParticipants: vi.fn(),
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
}));

// Helper to create mock participants
const createMockLocalParticipant = (identity: string): LocalParticipant => {
    return {
        identity,
        sid: `local-${identity}`,
    } as LocalParticipant;
};

const createMockRemoteParticipant = (identity: string): RemoteParticipant => {
    return {
        identity,
        sid: `remote-${identity}`,
    } as RemoteParticipant;
};

// Helper to create a mock room with event handlers
const createMockRoom = (localParticipant: LocalParticipant) => {
    const eventHandlers = new Map<string, Function[]>();

    return {
        localParticipant,
        on: vi.fn((event: string, handler: Function) => {
            if (!eventHandlers.has(event)) {
                eventHandlers.set(event, []);
            }
            eventHandlers.get(event)!.push(handler);
        }),
        off: vi.fn((event: string, handler: Function) => {
            const handlers = eventHandlers.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }),
        emit: (event: string, ...args: any[]) => {
            const handlers = eventHandlers.get(event);
            if (handlers) {
                handlers.forEach((handler) => handler(...args));
            }
        },
    } as unknown as Room;
};

describe('useSortedParticipants', () => {
    const localParticipant = createMockLocalParticipant('local-user');
    const remoteParticipant1 = createMockRemoteParticipant('remote-1');
    const remoteParticipant2 = createMockRemoteParticipant('remote-2');
    const remoteParticipant3 = createMockRemoteParticipant('remote-3');
    const remoteParticipant4 = createMockRemoteParticipant('remote-4');
    const remoteParticipant5 = createMockRemoteParticipant('remote-5');

    let mockRoom: Room;

    beforeEach(() => {
        mockRoom = createMockRoom(localParticipant);
        vi.mocked(useRoomContext).mockReturnValue(mockRoom);
        vi.mocked(useMeetSelector).mockReturnValue(4); // Default page size
    });

    it('should have the local participant as the first participant', () => {
        const participants = [remoteParticipant1, remoteParticipant2, localParticipant];
        vi.mocked(useParticipants).mockReturnValue(participants);

        const { result } = renderHook(() => useSortedParticipants());

        expect(result.current.sortedParticipants[0]).toBe(localParticipant);
        expect(result.current.sortedParticipants[0].identity).toBe('local-user');
    });

    it('should not change the order of participants on speaking if there are less participants than the page size', () => {
        const participants = [localParticipant, remoteParticipant1, remoteParticipant2];
        vi.mocked(useParticipants).mockReturnValue(participants);
        vi.mocked(useMeetSelector).mockReturnValue(5); // Page size is 5, we have 3 participants

        const { result } = renderHook(() => useSortedParticipants());

        // Initial order: local, remote-1, remote-2
        expect(result.current.sortedParticipants.map((p) => p.identity)).toEqual([
            'local-user',
            'remote-1',
            'remote-2',
        ]);

        // Simulate active speaker change for a participant already on first page
        act(() => {
            mockRoom.emit(RoomEvent.ActiveSpeakersChanged, [remoteParticipant1]);
        });

        // Order should remain the same since all participants fit on first page
        // and remoteParticipant1 was already on the first page
        expect(result.current.sortedParticipants.map((p) => p.identity)).toEqual([
            'local-user',
            'remote-1',
            'remote-2',
        ]);
    });

    it('should not bring a participant forward if it is already on the first page and there are more participants than the page size', () => {
        const participants = [
            localParticipant,
            remoteParticipant1,
            remoteParticipant2,
            remoteParticipant3,
            remoteParticipant4,
            remoteParticipant5,
        ];
        vi.mocked(useParticipants).mockReturnValue(participants);
        vi.mocked(useMeetSelector).mockReturnValue(4); // Page size is 4

        const { result } = renderHook(() => useSortedParticipants());

        // Initial order should be: local, remote-1, remote-2, remote-3, remote-4, remote-5
        // First page has pageSize - 1 = 3 slots: local (always), remote-1, remote-2
        expect(result.current.sortedParticipants.map((p) => p.identity)).toEqual([
            'local-user',
            'remote-1',
            'remote-2',
            'remote-3',
            'remote-4',
            'remote-5',
        ]);

        // remoteParticipant1 speaks - it's already on first page (within first 3 positions)
        act(() => {
            mockRoom.emit(RoomEvent.ActiveSpeakersChanged, [remoteParticipant1]);
        });

        // Order should remain the same because remoteParticipant1 is already on first page
        expect(result.current.sortedParticipants.map((p) => p.identity)).toEqual([
            'local-user',
            'remote-1',
            'remote-2',
            'remote-3',
            'remote-4',
            'remote-5',
        ]);
    });

    it('should bring a participant forward if it is not on the first page and there are more participants than the page size', () => {
        const participants = [
            localParticipant,
            remoteParticipant1,
            remoteParticipant2,
            remoteParticipant3,
            remoteParticipant4,
            remoteParticipant5,
        ];
        vi.mocked(useParticipants).mockReturnValue(participants);
        vi.mocked(useMeetSelector).mockReturnValue(4); // Page size is 4

        const { result } = renderHook(() => useSortedParticipants());

        // Initial order: local, remote-1, remote-2, remote-3, remote-4, remote-5
        // First page: local, remote-1, remote-2 (pageSize - 1 = 3)

        // remoteParticipant5 speaks - it's NOT on first page
        act(() => {
            mockRoom.emit(RoomEvent.ActiveSpeakersChanged, [remoteParticipant5]);
        });

        // remoteParticipant5 should now be brought forward (after local participant)
        const newOrder = result.current.sortedParticipants.map((p) => p.identity);
        expect(newOrder[0]).toBe('local-user'); // Local always first
        expect(newOrder[1]).toBe('remote-5'); // Speaker brought forward
        expect(newOrder).toContain('remote-1');
        expect(newOrder).toContain('remote-2');
        expect(newOrder).toContain('remote-3');
        expect(newOrder).toContain('remote-4');
    });

    it('should remove a participant from the recent speakers if it is disconnected', () => {
        const participants = [
            localParticipant,
            remoteParticipant1,
            remoteParticipant2,
            remoteParticipant3,
            remoteParticipant4,
        ];
        vi.mocked(useParticipants).mockReturnValue(participants);
        vi.mocked(useMeetSelector).mockReturnValue(4);

        const { result } = renderHook(() => useSortedParticipants());

        // remoteParticipant4 speaks and gets moved forward
        act(() => {
            mockRoom.emit(RoomEvent.ActiveSpeakersChanged, [remoteParticipant4]);
        });

        let order = result.current.sortedParticipants.map((p) => p.identity);
        expect(order[1]).toBe('remote-4'); // Should be in recent speakers position

        // Now disconnect remoteParticipant4
        act(() => {
            mockRoom.emit(RoomEvent.ParticipantDisconnected, remoteParticipant4);
        });

        // Update the participants list to reflect disconnection
        const updatedParticipants = [localParticipant, remoteParticipant1, remoteParticipant2, remoteParticipant3];
        vi.mocked(useParticipants).mockReturnValue(updatedParticipants);

        // Trigger re-render
        const { result: newResult } = renderHook(() => useSortedParticipants());

        order = newResult.current.sortedParticipants.map((p) => p.identity);
        expect(order).not.toContain('remote-4');
    });

    it('should return an empty array if the room is disconnected', () => {
        const participants = [localParticipant, remoteParticipant1, remoteParticipant2];
        vi.mocked(useParticipants).mockReturnValue(participants);
        vi.mocked(useMeetSelector).mockReturnValue(4);

        const { result } = renderHook(() => useSortedParticipants());

        // Add some recent speakers first
        act(() => {
            mockRoom.emit(RoomEvent.ActiveSpeakersChanged, [remoteParticipant2]);
        });

        expect(result.current.sortedParticipants.length).toBeGreaterThan(0);

        // Disconnect the room
        act(() => {
            mockRoom.emit(RoomEvent.Disconnected);
        });

        // After disconnection, when useParticipants returns empty, sorted should only have local
        vi.mocked(useParticipants).mockReturnValue([]);

        const { result: newResult } = renderHook(() => useSortedParticipants());

        // Should only contain local participant (or be filtered to truthy values)
        expect(newResult.current.sortedParticipants.every((p) => p.identity === 'local-user')).toBe(true);
    });
});
