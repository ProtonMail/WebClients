import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';

const isMeetCoreErrorEnum = (value: unknown): value is MeetCoreErrorEnum =>
    typeof value === 'number' && typeof MeetCoreErrorEnum[value] === 'string';

export const toMeetCoreErrorEnum = (error: unknown): MeetCoreErrorEnum | undefined => {
    if (isMeetCoreErrorEnum(error)) {
        return error;
    }

    if (error instanceof Error) {
        const { kind, coreError } = error as { kind?: unknown; coreError?: unknown };

        if (isMeetCoreErrorEnum(kind)) {
            return kind;
        }

        if (isMeetCoreErrorEnum(coreError)) {
            return coreError;
        }
    }

    return undefined;
};

export const getMeetCoreErrorName = (error: unknown): string | undefined => {
    const value = toMeetCoreErrorEnum(error);

    return value === undefined ? undefined : MeetCoreErrorEnum[value];
};
