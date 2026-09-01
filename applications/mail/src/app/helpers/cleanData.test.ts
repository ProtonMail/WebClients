import { deleteAssistantCachedFiles } from '@proton/llm/lib/downloader';
import { logger } from '@proton/logger';

import { getExistingIndexService } from '../contentSearch/indexation/IndexService';
import { cleanData, cleanDataLogout } from './cleanData';

// These tests pin down cleanData's option gating: each option drives exactly its own cleanup and
// nothing else, and the injected `esDelete` (not a raw DB drop) is what wipes the v1 ES database.
jest.mock('@proton/logger', () => ({
    logger: {
        isInitialized: jest.fn().mockReturnValue(true),
        clearLogs: jest.fn(),
    },
}));

jest.mock('@proton/llm/lib/downloader', () => ({
    deleteAssistantCachedFiles: jest.fn(),
}));

jest.mock('../contentSearch/indexation/IndexService', () => ({
    getExistingIndexService: jest.fn().mockReturnValue({ deleteIndex: jest.fn() }),
}));

const userID = 'user-id';

describe('data cleaning helpers', () => {
    describe('cleanData', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            (getExistingIndexService as jest.Mock).mockReturnValue({ deleteIndex: jest.fn() });
        });

        it('clears logs when the logs option is set', async () => {
            await cleanData(userID, { logs: true });
            expect(logger.clearLogs).toHaveBeenCalledTimes(1);
        });

        it('does not clear logs when the option is unset', async () => {
            await cleanData(userID, {});
            expect(logger.clearLogs).not.toHaveBeenCalled();
        });

        it('does not clear logs when the logger was never initialized', async () => {
            (logger.isInitialized as jest.Mock).mockReturnValueOnce(false);
            await cleanData(userID, { logs: true });
            expect(logger.clearLogs).not.toHaveBeenCalled();
        });

        it('deletes the content search index through the index service', async () => {
            const deleteIndex = jest.fn();
            (getExistingIndexService as jest.Mock).mockReturnValue({ deleteIndex });
            await cleanData(userID, { contentSearch: true });
            expect(deleteIndex).toHaveBeenCalledTimes(1);
        });

        it('skips without error when no index service exists', async () => {
            (getExistingIndexService as jest.Mock).mockReturnValue(undefined);
            await expect(cleanData(userID, { contentSearch: true })).resolves.toBeUndefined();
        });

        it('does not touch the index service when the option is unset', async () => {
            await cleanData(userID, { logs: true });
            expect(getExistingIndexService).not.toHaveBeenCalled();
        });

        it('uses the injected esDelete to wipe the v1 ES database', async () => {
            const esDelete = jest.fn();
            await cleanData(userID, { esDelete });
            expect(esDelete).toHaveBeenCalledTimes(1);
        });

        it('deletes assistant cached files when the option is set', async () => {
            await cleanData(userID, { assistantFiles: true });
            expect(deleteAssistantCachedFiles).toHaveBeenCalledTimes(1);
        });

        it('does not delete assistant cached files when the option is unset', async () => {
            await cleanData(userID, { logs: true });
            expect(deleteAssistantCachedFiles).not.toHaveBeenCalled();
        });

        it('settles when a cleanup rejects', async () => {
            (getExistingIndexService as jest.Mock).mockReturnValue({
                deleteIndex: jest.fn().mockRejectedValue(new Error('boom')),
            });
            await expect(cleanData(userID, { contentSearch: true })).resolves.toBeUndefined();
        });

        describe('cleanDataLogout', () => {
            it('clears logs and the content search index, but not the ES database nor assistant files', async () => {
                await cleanDataLogout({ UserID: userID } as Parameters<typeof cleanDataLogout>[0]);

                expect(logger.clearLogs).toHaveBeenCalledTimes(1);
                expect(getExistingIndexService).toHaveBeenCalledWith(userID);
                // The v1 ES DB is deliberately kept to avoid re-indexing the whole mailbox
                expect(deleteAssistantCachedFiles).not.toHaveBeenCalled();
            });
        });
    });
});
