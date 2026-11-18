import { ConnectionState } from 'livekit-client';

import { getReconnectingCause } from './getReconnectingCause';

const connected = {
    isReconnecting: false,
    mlsRetrying: false,
    isDisconnected: false,
    liveKitConnectionState: ConnectionState.Connected,
    isWebsocketReconnecting: false,
};

describe('getReconnectingCause', () => {
    it('has no cause while everything is connected', () => {
        expect(getReconnectingCause(connected)).toBeNull();
    });

    it('is the meeting server when only the meeting server is reconnecting', () => {
        expect(getReconnectingCause({ ...connected, isWebsocketReconnecting: true })).toBe('meetingServer');
    });

    it.each([
        { name: 'a full rejoin', state: { isReconnecting: true }, expected: 'fullRejoin' },
        { name: 'an encryption retry', state: { mlsRetrying: true }, expected: 'encryptionRetry' },
        {
            name: 'a LiveKit signal reconnection',
            state: { liveKitConnectionState: ConnectionState.SignalReconnecting },
            expected: 'liveKitReconnect',
        },
        {
            name: 'a LiveKit reconnection',
            state: { liveKitConnectionState: ConnectionState.Reconnecting },
            expected: 'liveKitReconnect',
        },
    ])('gives $name priority over the meeting server', ({ state, expected }) => {
        expect(getReconnectingCause({ ...connected, ...state, isWebsocketReconnecting: true })).toBe(expected);
    });

    it('keeps the existing order between the other causes', () => {
        expect(
            getReconnectingCause({
                ...connected,
                isReconnecting: true,
                mlsRetrying: true,
                liveKitConnectionState: ConnectionState.Reconnecting,
            })
        ).toBe('fullRejoin');
        expect(
            getReconnectingCause({
                ...connected,
                mlsRetrying: true,
                liveKitConnectionState: ConnectionState.Reconnecting,
            })
        ).toBe('encryptionRetry');
    });

    it('ignores LiveKit and the meeting server once the reconnection failed', () => {
        expect(
            getReconnectingCause({
                ...connected,
                isDisconnected: true,
                liveKitConnectionState: ConnectionState.Reconnecting,
                isWebsocketReconnecting: true,
            })
        ).toBeNull();
    });
});
