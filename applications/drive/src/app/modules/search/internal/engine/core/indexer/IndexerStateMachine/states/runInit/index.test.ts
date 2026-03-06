import { runInit } from '.';
import type { IndexerContext } from '../../types';

jest.mock('../../../../../../Logger', () => ({
    Logger: { info: jest.fn() },
}));

const signal = new AbortController().signal;

const makeCtx = (activeConfigKey: string | null, requiredConfigKey: string): IndexerContext =>
    ({
        db: { getEngineState: jest.fn().mockResolvedValue({ activeConfigKey }) },
        requiredConfigKey,
    }) as unknown as IndexerContext;

describe('runInit', () => {
    it('returns up_to_date when active and required keys are identical', async () => {
        const result = await runInit(makeCtx('v1', 'v1'), signal);
        expect(result).toEqual({ outcome: 'up_to_date' });
    });

    it('returns needs_bulk_update when keys differ', async () => {
        const result = await runInit(makeCtx('v1', 'v2'), signal);
        expect(result).toEqual({ outcome: 'needs_bulk_update' });
    });

    it('returns needs_bulk_update when no active config key exists (first run)', async () => {
        const result = await runInit(makeCtx(null, 'v1'), signal);
        expect(result).toEqual({ outcome: 'needs_bulk_update' });
    });

    it('propagates errors thrown by db.getEngineState()', async () => {
        const cause = new Error('db failure');
        const ctx = {
            db: { getEngineState: jest.fn().mockRejectedValue(cause) },
            requiredConfigKey: 'v1',
        } as unknown as IndexerContext;

        await expect(runInit(ctx, signal)).rejects.toThrow('db failure');
    });
});
