import { LogLevel } from 'livekit-client';

import { isLiveKitLogAllowedToSend, redactLogs } from './liveKitLogging';

describe('liveKitLogging', () => {
    describe('redactLogs', () => {
        it('should redact details from logs', () => {
            const mockLogMsg = 'received server answer';
            const mockLogContext = {
                room: 'mock_room',
                roomID: 'RM_mock_room_id',
                participant: 'mockParticipant',
                pID: 'mockParticipantId',
                RTCSdpType: 'answer',
                sdp: `v=0\r
    o=- 11111111111111111 1111111111 IN IP4 0.0.0.0\r
    s=-\r
    t=0 0\r
    a=msid-semantic:WMS *\r
    a=fingerprint:sha-256_mock-fingerprint-value\r
    a=extmap-allow-mixed\r
    a=group:BUNDLE 0 1\r
    m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r
    c=IN IP4 0.0.0.0\r
    a=setup:active\r
    a=mid:0\r
    a=sendrecv\r
    a=sctp-port:11111\r
    a=max-message-size:65535\r
    a=ice-ufrag:mock-ice-ufrag\r
    a=ice-pwd:mock-ice-pwd\r
    a=candidate:123456789 1 udp 123456789 10.11.12.13 11111 typ host ufrag mock-ice-ufrag\r
    a=candidate:123456789 2 udp 123456789 10.11.12.13 11111 typ host ufrag mock-ice-ufrag\r
    a=candidate:123456789 1 udp 123456789 11.12.13.14 11111 typ host ufrag mock-ice-ufrag\r
    a=candidate:123456789 2 udp 123456789 12.13.14.15 12345 typ host ufrag mock-ice-ufrag\r
    a=candidate:123456789 1 tcp 123456789 15.16.17.18 1111 typ host tcptype passive ufrag mock-ice-ufrag\r
    a=candidate:123456789 2 tcp 123456789 16.17.18.19 1111 typ host tcptype passive ufrag mock-ice-ufrag\r
    a=candidate:123456789 1 tcp 123456789 10.10.10.10 1111 typ host tcptype passive ufrag mock-ice-ufrag\r
    a=candidate:123456789 2 tcp 123456789 17.18.19.20 1111 typ host tcptype passive ufrag mock-ice-ufrag\r
    a=end-of-candidates\r
    m=audio 9 UDP/TLS/RTP/SAVPF 111 63 0 8\r
    c=IN IP4 0.0.0.0\r
    a=setup:active\r
    a=mid:1\r
    a=ice-ufrag:mock-ice-ufrag\r
    a=ice-pwd:mock-ice-pwd\r
    a=rtcp-mux\r
    a=rtcp-rsize\r
    a=rtpmap:111 opus/48000/2\r
    a=fmtp:111 minptime=10;useinbandfec=1\r
    a=rtpmap:63 red/48000/2\r
    a=fmtp:63 111/111\r
    a=rtpmap:0 PCMU/8000\r
    a=rtpmap:8 PCMA/8000\r
    a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
    a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
    a=recvonly\r
    `,
                midToTrackId: {},
            };

            const result = redactLogs(mockLogMsg, mockLogContext);

            // Message should remain unchanged
            expect(result.msg).toBe('received server answer');

            // Context should have redacted values
            expect(result.context).toBeDefined();
            const redactedContext = result.context as typeof mockLogContext;

            // Non-sensitive fields should remain unchanged
            expect(redactedContext.room).toBe('mock_room');
            expect(redactedContext.roomID).toBe('RM_mock_room_id');
            expect(redactedContext.participant).toBe('mockParticipant');
            expect(redactedContext.pID).toBe('mockParticipantId');
            expect(redactedContext.RTCSdpType).toBe('answer');

            // SDP should have redacted sensitive values
            const redactedSdp = redactedContext.sdp;

            // ice-ufrag lines should be completely removed
            expect(redactedSdp).not.toContain('mock-ice-ufrag');
            expect(redactedSdp).not.toContain('a=ice-ufrag:');

            // ice-pwd lines should be completely removed
            expect(redactedSdp).not.toContain('mock-ice-pwd');
            expect(redactedSdp).not.toContain('a=ice-pwd:');

            // fingerprint lines should be completely removed
            expect(redactedSdp).not.toContain('sha-256_mock-fingerprint-value');
            expect(redactedSdp).not.toContain('a=fingerprint:');

            // But sensitive values should be redacted in other occurrences (like in candidate lines)
            expect(redactedSdp).toContain('ufrag [REDACTED]');

            // IPv4 addresses should be redacted
            expect(redactedSdp).not.toContain('10.11.12.13');
            expect(redactedSdp).not.toContain('11.12.13.14');
            expect(redactedSdp).not.toContain('12.13.14.15');
            expect(redactedSdp).not.toContain('15.16.17.18');
            expect(redactedSdp).not.toContain('16.17.18.19');
            expect(redactedSdp).not.toContain('10.10.10.10');
            expect(redactedSdp).not.toContain('17.18.19.20');
            expect(redactedSdp).toContain('[REDACTED_IPv4]');

            // The candidate lines should contain redacted values
            expect(redactedSdp).toContain(
                'a=candidate:123456789 1 udp 123456789 [REDACTED_IPv4] 11111 typ host ufrag [REDACTED]'
            );
        });

        it('should redact IPv6 addresses from logs', () => {
            const mockLogMsg = 'received server answer with IPv6';
            const mockLogContext = {
                room: 'mock_room',
                roomID: 'RM_mock_room_id',
                participant: 'mockParticipant',
                pID: 'mockParticipantId',
                RTCSdpType: 'answer',
                sdp: `v=0\r
    o=- 11111111111111111 1111111111 IN IP6 2001:0db8:85a3:0000:0000:8a2e:0370:7334\r
    s=-\r
    t=0 0\r
    a=msid-semantic:WMS *\r
    a=fingerprint:sha-256_mock-fingerprint-value\r
    a=extmap-allow-mixed\r
    a=group:BUNDLE 0 1\r
    m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r
    c=IN IP6 2001:db8::1\r
    a=setup:active\r
    a=mid:0\r
    a=sendrecv\r
    a=sctp-port:11111\r
    a=max-message-size:65535\r
    a=ice-ufrag:mock-ice-ufrag-v6\r
    a=ice-pwd:mock-ice-pwd-v6\r
    a=candidate:123456789 1 udp 123456789 2001:0db8:85a3::8a2e:0370:7334 11111 typ host ufrag mock-ice-ufrag-v6\r
    a=candidate:123456789 2 udp 123456789 fe80::1 11111 typ host ufrag mock-ice-ufrag-v6\r
    a=candidate:123456789 1 udp 123456789 ::1 11111 typ host ufrag mock-ice-ufrag-v6\r
    a=candidate:123456789 2 udp 123456789 2001:db8:0:0:0:0:0:1 12345 typ host ufrag mock-ice-ufrag-v6\r
    a=end-of-candidates\r
    m=audio 9 UDP/TLS/RTP/SAVPF 111 63 0 8\r
    c=IN IP6 2001:db8:85a3::8a2e:370:7334\r
    a=setup:active\r
    a=mid:1\r
    a=ice-ufrag:mock-ice-ufrag-v6\r
    a=ice-pwd:mock-ice-pwd-v6\r
    a=rtcp-mux\r
    a=rtcp-rsize\r
    a=rtpmap:111 opus/48000/2\r
    a=recvonly\r
    `,
                midToTrackId: {},
            };

            const result = redactLogs(mockLogMsg, mockLogContext);

            // Message should remain unchanged
            expect(result.msg).toBe('received server answer with IPv6');

            // Context should have redacted values
            expect(result.context).toBeDefined();
            const redactedContext = result.context as typeof mockLogContext;

            // Non-sensitive fields should remain unchanged
            expect(redactedContext.room).toBe('mock_room');
            expect(redactedContext.roomID).toBe('RM_mock_room_id');
            expect(redactedContext.participant).toBe('mockParticipant');
            expect(redactedContext.pID).toBe('mockParticipantId');
            expect(redactedContext.RTCSdpType).toBe('answer');

            // SDP should have redacted sensitive values
            const redactedSdp = redactedContext.sdp;

            // ice-ufrag lines should be completely removed
            expect(redactedSdp).not.toContain('mock-ice-ufrag-v6');
            expect(redactedSdp).not.toContain('a=ice-ufrag:');

            // ice-pwd lines should be completely removed
            expect(redactedSdp).not.toContain('mock-ice-pwd-v6');
            expect(redactedSdp).not.toContain('a=ice-pwd:');

            // fingerprint lines should be completely removed
            expect(redactedSdp).not.toContain('sha-256_mock-fingerprint-value');
            expect(redactedSdp).not.toContain('a=fingerprint:');

            // But sensitive values should be redacted in other occurrences
            expect(redactedSdp).toContain('ufrag [REDACTED]');

            // IPv6 addresses should be redacted
            expect(redactedSdp).not.toContain('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
            expect(redactedSdp).not.toContain('2001:db8::1');
            expect(redactedSdp).not.toContain('2001:0db8:85a3::8a2e:0370:7334');
            expect(redactedSdp).not.toContain('fe80::1');
            expect(redactedSdp).not.toContain('::1');
            expect(redactedSdp).not.toContain('2001:db8:0:0:0:0:0:1');
            expect(redactedSdp).not.toContain('2001:db8:85a3::8a2e:370:7334');
            expect(redactedSdp).toContain('[REDACTED_IPv6]');

            // The candidate lines should contain redacted values
            expect(redactedSdp).toContain(
                'a=candidate:123456789 1 udp 123456789 [REDACTED_IPv6] 11111 typ host ufrag [REDACTED]'
            );
        });
    });

    describe('isLiveKitLogAllowedToSend', () => {
        it('should reject trace level logs', () => {
            const result = isLiveKitLogAllowedToSend(LogLevel.trace, 'some trace message');
            expect(result).toBe(false);
        });

        it('should reject forbidden LiveKit log messages', () => {
            const forbiddenMessages = [
                'prepareconnection to example.com',
                'prepared connection to server',
                'sending ice candidate to peer',
                'got ice candidate from peer',
                'room moved to new region',
                'key ratcheted event received',
                'setting new key with index 5',
                'websocket connection closed',
                'websocket error occurred',
                'websocket error while closing',
                'could not prepare connection',
                'auto refetching of region settings failed',
                'error trying to establish signal connection',
                'received unrecoverable error',
                'unsupported data type',
            ];

            for (const msg of forbiddenMessages) {
                const result = isLiveKitLogAllowedToSend(LogLevel.info, msg);
                expect(result).toBe(false);
            }
        });

        it('should reject messages containing forbidden patterns in message text', () => {
            const forbiddenPatterns = [
                'user password is wrong',
                'pwd value incorrect',
                'secret key validation',
                'passwd check failed',
                'api_key missing',
                'apikey validation',
                'access_token expired',
                'auth failed',
                'credentials invalid',
                'privatekey not found',
                'private_key missing',
                'token refresh needed',
            ];

            for (const msg of forbiddenPatterns) {
                const result = isLiveKitLogAllowedToSend(LogLevel.warn, msg);
                expect(result).toBe(false);
            }
        });

        it('should reject messages with forbidden patterns in context object', () => {
            const contexts = [
                { error: 'password validation failed' },
                { data: { pwd: 'secret123' } },
                { auth: { token: 'abc123' } },
                { credentials: { username: 'user', apikey: 'key123' } },
                { config: { private_key: 'key' } },
            ];

            for (const context of contexts) {
                const result = isLiveKitLogAllowedToSend(LogLevel.error, 'connection error', context);
                expect(result).toBe(false);
            }
        });

        it('should allow clean messages without forbidden patterns', () => {
            const allowedMessages = [
                { level: LogLevel.debug, msg: 'connection established successfully' },
                { level: LogLevel.info, msg: 'participant joined the room' },
                { level: LogLevel.warn, msg: 'network quality degraded' },
                { level: LogLevel.error, msg: 'failed to connect to server' },
                {
                    level: LogLevel.info,
                    msg: 'track published',
                    context: { trackId: 'track123', participantId: 'p123' },
                },
            ];

            for (const { level, msg, context } of allowedMessages) {
                const result = isLiveKitLogAllowedToSend(level, msg, context);
                expect(result).toBe(true);
            }
        });
    });
});
