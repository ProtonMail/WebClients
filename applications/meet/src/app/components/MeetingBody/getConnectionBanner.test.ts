import { ConnectionState } from 'livekit-client';

import { getConnectionBanner } from './getConnectionBanner';

const connected = {
    isReconnecting: false,
    mlsRetrying: false,
    isDisconnected: false,
    liveKitConnectionState: ConnectionState.Connected,
    showReconnectedMessage: false,
    isWebsocketReconnecting: false,
};

describe('getConnectionBanner', () => {
    it('shows no banner while everything is connected', () => {
        expect(getConnectionBanner(connected)).toBeNull();
    });

    it('shows the meeting server banner when only the meeting server is reconnecting', () => {
        expect(getConnectionBanner({ ...connected, isWebsocketReconnecting: true })).toBe('meetingServerReconnecting');
    });

    it.each([
        { name: 'a full reconnection', state: { isReconnecting: true }, expected: 'fullReconnect' },
        { name: 'an MLS retry', state: { mlsRetrying: true }, expected: 'mlsRetrying' },
        {
            name: 'a LiveKit signal reconnection',
            state: { liveKitConnectionState: ConnectionState.SignalReconnecting },
            expected: 'liveKit',
        },
        {
            name: 'a LiveKit reconnection',
            state: { liveKitConnectionState: ConnectionState.Reconnecting },
            expected: 'liveKit',
        },
        { name: 'the LiveKit reconnected message', state: { showReconnectedMessage: true }, expected: 'liveKit' },
    ])('gives $name priority over the meeting server banner', ({ state, expected }) => {
        expect(getConnectionBanner({ ...connected, ...state, isWebsocketReconnecting: true })).toBe(expected);
    });

    it('keeps the existing order between the other banners', () => {
        expect(
            getConnectionBanner({
                ...connected,
                isReconnecting: true,
                mlsRetrying: true,
                liveKitConnectionState: ConnectionState.Reconnecting,
            })
        ).toBe('fullReconnect');
        expect(
            getConnectionBanner({
                ...connected,
                mlsRetrying: true,
                liveKitConnectionState: ConnectionState.Reconnecting,
            })
        ).toBe('mlsRetrying');
    });

    it('shows neither the LiveKit nor the meeting server banner once the reconnection failed', () => {
        expect(
            getConnectionBanner({
                ...connected,
                isDisconnected: true,
                liveKitConnectionState: ConnectionState.Reconnecting,
                isWebsocketReconnecting: true,
            })
        ).toBeNull();
    });
});
