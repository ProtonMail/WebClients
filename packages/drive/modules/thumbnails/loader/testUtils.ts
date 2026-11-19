import type { MockedFunction } from 'vitest';

import type { DriveClient } from './types';

export type MockDrive = { iterateThumbnails: MockedFunction<DriveClient['iterateThumbnails']> };

export type ThumbnailResult = { nodeUid: string; ok: boolean; thumbnail?: Uint8Array<ArrayBuffer> };

/** Yields only the uids the SDK was actually asked for, in the order it was asked. */
export const makeDrive = (results: ThumbnailResult[]) =>
    ({
        iterateThumbnails: vi.fn(async function* (uids: string[]) {
            for (const uid of uids) {
                const match = results.find((result) => result.nodeUid === uid);
                if (match) {
                    yield match;
                }
            }
        }),
    }) as unknown as MockDrive;
