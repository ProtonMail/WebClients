import { IndexingJob } from './IndexingJob';
import { fakeImportHandle, fakeIndexService, fakeV1Status, flushPromises } from './testFakes';

const setup = (mode: 'index' | 'refresh') => {
    const importRun = fakeImportHandle();
    const job = new IndexingJob(
        {
            indexService: fakeIndexService(importRun.handle),
            initialV1Status: fakeV1Status(),
            updateESStatus: jest.fn(),
            updateESProgress: jest.fn(),
            waitForV1Sync: jest.fn().mockResolvedValue(undefined),
        },
        mode
    );
    return { job, importRun };
};

/** Whether `ended` has resolved, and with what, without awaiting it. */
const watchEnded = (job: IndexingJob) => {
    const state: { outcome?: string } = {};
    void job.ended.then((outcome) => {
        state.outcome = outcome;
    });
    return state;
};

describe('IndexingJob', () => {
    describe('ended', () => {
        it('should resolve with the import outcome', async () => {
            const { job, importRun } = setup('index');
            const ended = watchEnded(job);

            // Hands the job from v1 to the import.
            job.onV1Status(fakeV1Status());
            await flushPromises();
            expect(ended.outcome).toBeUndefined();

            importRun.end('completed');
            await flushPromises();
            expect(ended.outcome).toBe('completed');
        });

        it('should resolve with the import outcome of a refresh', async () => {
            const { job, importRun } = setup('refresh');
            const ended = watchEnded(job);
            await flushPromises();

            importRun.end('failed');
            await flushPromises();
            expect(ended.outcome).toBe('failed');
        });

        // Whoever waits on a job has to be released when it is torn down: a dispose reports no outcome
        // of its own, and nothing else will report one afterwards.
        it('should resolve when the job is disposed', async () => {
            const { job } = setup('index');
            const ended = watchEnded(job);

            job.dispose();
            await flushPromises();

            expect(ended.outcome).toBe('disposed');
        });

        it('should keep the first ending when the job is disposed afterwards', async () => {
            const { job, importRun } = setup('index');
            const ended = watchEnded(job);

            job.onV1Status(fakeV1Status());
            await flushPromises();
            importRun.end('completed');
            await flushPromises();

            job.dispose();
            await flushPromises();

            expect(ended.outcome).toBe('completed');
        });
    });
});
