import { renderHook } from '@testing-library/react';
import { ConnectionState } from 'livekit-client';

import type { ConnectionAnnouncementState } from '../types';
import { getConnectionPhase, useConnectionAnnouncements } from './useConnectionAnnouncements';

const announce = vi.fn();

vi.mock('@proton/components/components/liveAnnouncer/useAnnounce', () => ({ useAnnounce: () => announce }));

const connected: ConnectionAnnouncementState = {
    isReconnecting: false,
    mlsRetrying: false,
    isDisconnected: false,
    liveKitConnectionState: ConnectionState.Connected,
    showReconnectedMessage: false,
    isWebsocketReconnecting: false,
};

describe('getConnectionPhase', () => {
    it('is connected while every connection is up', () => {
        expect(getConnectionPhase(connected)).toBe('connected');
    });

    it('is reconnecting while the meeting server reconnects', () => {
        expect(getConnectionPhase({ ...connected, isWebsocketReconnecting: true })).toBe('reconnecting');
    });

    it('keeps the reconnected message ahead of a meeting server reconnection', () => {
        expect(getConnectionPhase({ ...connected, showReconnectedMessage: true, isWebsocketReconnecting: true })).toBe(
            'reconnected'
        );
    });

    it('is disconnected when the meeting server reconnects after the connection failed', () => {
        expect(getConnectionPhase({ ...connected, isDisconnected: true, isWebsocketReconnecting: true })).toBe(
            'disconnected'
        );
    });
});

describe('useConnectionAnnouncements', () => {
    beforeEach(() => {
        announce.mockClear();
    });

    const renderAnnouncements = () =>
        renderHook((state: ConnectionAnnouncementState) => useConnectionAnnouncements(state), {
            initialProps: connected,
        });

    it('announces the recovery when the meeting server reconnects without a reconnected message', () => {
        const { rerender } = renderAnnouncements();

        rerender({ ...connected, isWebsocketReconnecting: true });
        rerender(connected);

        expect(announce.mock.calls.map(([message]) => message)).toEqual([
            'Connection lost. Reconnecting…',
            'Reconnected to the meeting',
        ]);
    });

    it('does not announce a recovery when the LiveKit connection state is cleared while reconnecting', () => {
        const { rerender } = renderAnnouncements();

        rerender({ ...connected, liveKitConnectionState: ConnectionState.Reconnecting });
        rerender({ ...connected, liveKitConnectionState: null });

        expect(announce.mock.calls.map(([message]) => message)).toEqual(['Connection lost. Reconnecting…']);
    });

    it('does not announce a recovery when the MLS retry ends without a reconnected message', () => {
        const { rerender } = renderAnnouncements();

        rerender({ ...connected, mlsRetrying: true });
        rerender(connected);

        expect(announce.mock.calls.map(([message]) => message)).toEqual(['Connection lost. Reconnecting…']);
    });

    it('announces the recovery once when the reconnected message shows before connected', () => {
        const { rerender } = renderAnnouncements();

        rerender({ ...connected, liveKitConnectionState: ConnectionState.Reconnecting });
        rerender({ ...connected, showReconnectedMessage: true });
        rerender(connected);

        expect(announce.mock.calls.map(([message]) => message)).toEqual([
            'Connection lost. Reconnecting…',
            'Reconnected to the meeting',
        ]);
    });
});
