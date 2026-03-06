import { runIncrementalUpdate } from '.';
import { Logger } from '../../../../../../Logger';

jest.mock('../../../../../../Logger', () => ({
    Logger: { info: jest.fn() },
}));

describe('runIncrementalUpdate', () => {
    it('resolves without throwing', async () => {
        await expect(runIncrementalUpdate()).resolves.toBeUndefined();
    });

    it('logs the INCREMENTAL_UPDATE start message', async () => {
        await runIncrementalUpdate();
        expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('INCREMENTAL_UPDATE'));
    });
});
