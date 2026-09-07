import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';

import { getMeetCoreErrorName, toMeetCoreErrorEnum } from './meetCoreError';

describe('toMeetCoreErrorEnum', () => {
    it('reads a bare enum value', () => {
        expect(toMeetCoreErrorEnum(MeetCoreErrorEnum.HttpClientError)).toBe(MeetCoreErrorEnum.HttpClientError);
    });

    it('reads the kind stamped on an error by the worker client', () => {
        const error = Object.assign(new Error('boom'), { kind: MeetCoreErrorEnum.MeetingLocked });

        expect(toMeetCoreErrorEnum(error)).toBe(MeetCoreErrorEnum.MeetingLocked);
    });

    it('reads the core error kept when the mls setup rewraps it', () => {
        const error = Object.assign(new Error('MLS setup failed'), { coreError: MeetCoreErrorEnum.CheckDeviceClock });

        expect(toMeetCoreErrorEnum(error)).toBe(MeetCoreErrorEnum.CheckDeviceClock);
    });

    it('ignores a number outside the enum', () => {
        expect(toMeetCoreErrorEnum(422)).toBeUndefined();
    });

    it('ignores anything that is not a core error', () => {
        expect(toMeetCoreErrorEnum(new Error('boom'))).toBeUndefined();
        expect(toMeetCoreErrorEnum('boom')).toBeUndefined();
        expect(toMeetCoreErrorEnum(undefined)).toBeUndefined();
    });
});

describe('getMeetCoreErrorName', () => {
    it('names a core error', () => {
        expect(getMeetCoreErrorName(MeetCoreErrorEnum.WaitingRoomJoinCancelled)).toBe('WaitingRoomJoinCancelled');
    });

    it('names the first enum value', () => {
        expect(getMeetCoreErrorName(MeetCoreErrorEnum.AuthenticationFailed)).toBe('AuthenticationFailed');
    });

    it('returns nothing for anything else', () => {
        expect(getMeetCoreErrorName(new Error('boom'))).toBeUndefined();
    });
});
