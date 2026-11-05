import type { Mock } from 'vitest';

import { wait } from '@proton/shared/lib/helpers/promise';

import type { MeetCoreClient } from '../wasm/MeetCoreClient';
import { decryptMessageWithRetry } from './decryptMessageWithRetry';

vi.mock('@proton/shared/lib/helpers/promise', () => ({
    wait: vi.fn().mockResolvedValue(undefined),
}));

const decrypted = { sender_participant_id: 'sender', message: 'content' };

const run = (decryptMessage: Mock, reportMeetError = vi.fn()) =>
    decryptMessageWithRetry({
        meetCoreClient: { decryptMessage } as unknown as MeetCoreClient,
        encryptedData: new Uint8Array([1]),
        reportMeetError,
        failureLabel: 'Failed to decrypt test message',
    });

describe('decryptMessageWithRetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the first result without waiting', async () => {
        const decryptMessage = vi.fn().mockResolvedValue(decrypted);

        await expect(run(decryptMessage)).resolves.toEqual(decrypted);
        expect(decryptMessage).toHaveBeenCalledTimes(1);
        expect(wait).not.toHaveBeenCalled();
    });

    it('retries an empty result after 2 seconds without reporting it', async () => {
        const decryptMessage = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValue(decrypted);
        const reportMeetError = vi.fn();

        await expect(run(decryptMessage, reportMeetError)).resolves.toEqual(decrypted);
        expect(wait).toHaveBeenCalledWith(2_000);
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('reports each of the three failed attempts and returns undefined', async () => {
        const decryptMessage = vi.fn().mockRejectedValue(new Error('MLS group not ready'));
        const reportMeetError = vi.fn();

        await expect(run(decryptMessage, reportMeetError)).resolves.toBeUndefined();
        expect(decryptMessage).toHaveBeenCalledTimes(3);
        expect((wait as Mock).mock.calls).toEqual([[2_000], [4_000]]);
        expect(reportMeetError).toHaveBeenCalledTimes(3);
        expect(reportMeetError).toHaveBeenCalledWith('Failed to decrypt test message', { level: 'error' });
    });
});
