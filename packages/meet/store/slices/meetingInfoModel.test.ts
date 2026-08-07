import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CacheType } from '@proton/redux-utilities/interface';

import { meetingInfoModelReducer, meetingInfoThunk, refreshMeetingInfoThunk } from './meetingInfoModel';

vi.mock('../../api/meetSrpRequests', () => ({
    requestHandshakeInfo: vi.fn(),
    requestSessionToken: vi.fn(),
    requestMeetingInfo: vi.fn(),
}));

vi.mock('../../utils/cryptoUtils', () => ({
    decryptMeetingName: vi.fn(),
}));

const { requestHandshakeInfo, requestSessionToken, requestMeetingInfo } = await import('../../api/meetSrpRequests');
const { decryptMeetingName } = await import('../../utils/cryptoUtils');

const requestHandshakeInfoMock = vi.mocked(requestHandshakeInfo);
const requestSessionTokenMock = vi.mocked(requestSessionToken);
const requestMeetingInfoMock = vi.mocked(requestMeetingInfo);
const decryptMeetingNameMock = vi.mocked(decryptMeetingName);

const MEETING_LINK_NAME = 'meeting-abc';
const OTHER_MEETING_LINK_NAME = 'meeting-xyz';
const ALIAS_MEETING_LINK_NAME = 'meeting-alias';
const MEETING_PASSWORD = 'password1234';

const getMeetingInfoResponse = (meetingLinkName: string, expirationTime: number | null = null) =>
    ({
        MeetingInfo: {
            MeetingLinkName: meetingLinkName,
            Salt: 'salt',
            SessionKey: 'session-key',
            MeetingName: 'encrypted-name',
            CustomPassword: 0,
            Locked: 0,
            MaxDuration: 3600,
            MaxParticipants: 100,
            ExpirationTime: expirationTime,
        },
        Code: 1000,
    }) as any;

const createNotification = vi.fn();

const setupStore = () =>
    configureStore({
        reducer: { ...meetingInfoModelReducer } as any,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                thunk: {
                    extraArgument: {
                        api: vi.fn(),
                        authentication: { UID: 'uid-1' },
                        notificationsManager: { createNotification },
                    } as any,
                },
            }),
    });

const countRequests = () => ({
    handshake: requestHandshakeInfoMock.mock.calls.length,
    sessionToken: requestSessionTokenMock.mock.calls.length,
    meetingInfo: requestMeetingInfoMock.mock.calls.length,
});

describe('meetingInfoModel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requestHandshakeInfoMock.mockResolvedValue({ SRPSession: 'srp-session' } as any);
        requestSessionTokenMock.mockResolvedValue({} as any);
        requestMeetingInfoMock.mockImplementation((_api, meetingLinkName) =>
            Promise.resolve(getMeetingInfoResponse(meetingLinkName))
        );
        decryptMeetingNameMock.mockResolvedValue('Weekly sync');
    });

    describe('meetingInfoThunk', () => {
        it('stores the raw meeting info together with the decrypted name', async () => {
            const store = setupStore();

            const value = await store.dispatch(
                meetingInfoThunk({ meetingLinkName: MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD }) as any
            );

            expect(value).toEqual({
                meetingLinkName: MEETING_LINK_NAME,
                meetingInfo: getMeetingInfoResponse(MEETING_LINK_NAME).MeetingInfo,
                meetingName: 'Weekly sync',
            });
            expect(countRequests()).toEqual({ handshake: 1, sessionToken: 1, meetingInfo: 1 });
        });

        it('shares the in flight request between concurrent dispatches', async () => {
            const store = setupStore();
            const options = { meetingLinkName: MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD };

            const [first, second] = await Promise.all([
                store.dispatch(meetingInfoThunk(options) as any),
                store.dispatch(meetingInfoThunk(options) as any),
            ]);

            expect(first).toBe(second);
            expect(countRequests()).toEqual({ handshake: 1, sessionToken: 1, meetingInfo: 1 });
        });

        it('serves the cached value on a later dispatch without requesting again', async () => {
            const store = setupStore();
            const options = { meetingLinkName: MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD };

            await store.dispatch(meetingInfoThunk(options) as any);
            await store.dispatch(meetingInfoThunk(options) as any);

            expect(countRequests()).toEqual({ handshake: 1, sessionToken: 1, meetingInfo: 1 });
        });

        it('refetches for a different meeting instead of serving the previous one', async () => {
            const store = setupStore();

            await store.dispatch(
                meetingInfoThunk({ meetingLinkName: MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD }) as any
            );
            const value = await store.dispatch(
                meetingInfoThunk({
                    meetingLinkName: OTHER_MEETING_LINK_NAME,
                    meetingPassword: MEETING_PASSWORD,
                }) as any
            );

            expect(value.meetingLinkName).toBe(OTHER_MEETING_LINK_NAME);
            expect(countRequests()).toEqual({ handshake: 2, sessionToken: 2, meetingInfo: 2 });
        });

        it('ignores the cache when asked to', async () => {
            const store = setupStore();
            const options = { meetingLinkName: MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD };

            await store.dispatch(meetingInfoThunk(options) as any);
            await store.dispatch(meetingInfoThunk({ ...options, cache: CacheType.None }) as any);

            expect(countRequests()).toEqual({ handshake: 2, sessionToken: 2, meetingInfo: 2 });
        });

        it('skips the handshake request when the caller already has one', async () => {
            const store = setupStore();

            await store.dispatch(
                meetingInfoThunk({
                    meetingLinkName: MEETING_LINK_NAME,
                    meetingPassword: MEETING_PASSWORD,
                    handshakeInfo: { SRPSession: 'given' } as any,
                }) as any
            );

            expect(countRequests()).toEqual({ handshake: 0, sessionToken: 1, meetingInfo: 1 });
        });

        it('notifies the user and flags the error when the password is wrong', async () => {
            const store = setupStore();
            const wrongPasswordError = { data: { Code: 2026, Error: 'Invalid SRP parameter' } };
            requestSessionTokenMock.mockRejectedValue(wrongPasswordError);

            await expect(
                store.dispatch(
                    meetingInfoThunk({ meetingLinkName: MEETING_LINK_NAME, meetingPassword: 'wrong' }) as any
                )
            ).rejects.toBe(wrongPasswordError);

            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'error', text: 'The meeting password is incorrect' })
            );
            expect(wrongPasswordError).toHaveProperty('userNotified', true);
            expect(countRequests().meetingInfo).toBe(0);
        });

        it('does not notify the user for errors other than a wrong password', async () => {
            const store = setupStore();
            requestSessionTokenMock.mockRejectedValue({ data: { Code: 2502, Error: 'Meeting is locked' } });

            await expect(
                store.dispatch(
                    meetingInfoThunk({ meetingLinkName: MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD }) as any
                )
            ).rejects.toBeTruthy();

            expect(createNotification).not.toHaveBeenCalled();
        });
    });

    describe('refreshMeetingInfoThunk', () => {
        it('does not alias a full fetch that is still in flight', async () => {
            const store = setupStore();
            const options = { meetingLinkName: ALIAS_MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD };

            // Keep the full fetch stuck before its GET, so an aliased refresh would never resolve
            let resolveSessionToken: (response: unknown) => void = () => {};
            requestSessionTokenMock.mockImplementationOnce(
                () => new Promise((resolve) => (resolveSessionToken = resolve)) as any
            );
            requestMeetingInfoMock.mockResolvedValue(getMeetingInfoResponse(ALIAS_MEETING_LINK_NAME, 1893456000));

            const pendingFetch = store.dispatch(meetingInfoThunk(options) as any);
            const refreshed = await store.dispatch(refreshMeetingInfoThunk(options) as any);

            expect(refreshed.meetingInfo.ExpirationTime).toBe(1893456000);
            expect(countRequests().meetingInfo).toBe(1);

            resolveSessionToken({});
            await pendingFetch;

            expect(countRequests().meetingInfo).toBe(2);
        });

        it('re-reads the meeting info without redoing the SRP handshake', async () => {
            const store = setupStore();
            const options = { meetingLinkName: MEETING_LINK_NAME, meetingPassword: MEETING_PASSWORD };

            await store.dispatch(meetingInfoThunk(options) as any);
            requestMeetingInfoMock.mockResolvedValue(getMeetingInfoResponse(MEETING_LINK_NAME, 1893456000));

            const value = await store.dispatch(refreshMeetingInfoThunk(options) as any);

            expect(value.meetingInfo.ExpirationTime).toBe(1893456000);
            expect(countRequests()).toEqual({ handshake: 1, sessionToken: 1, meetingInfo: 2 });
        });
    });
});
