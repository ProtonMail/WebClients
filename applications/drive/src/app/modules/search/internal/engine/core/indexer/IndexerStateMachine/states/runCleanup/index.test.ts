import { runCleanup } from '.';
import { Logger } from '../../../../../../Logger';

jest.mock('../../../../../../Logger', () => ({
    Logger: { info: jest.fn() },
}));

describe('runCleanup', () => {
    it('resolves without throwing', async () => {
        await expect(runCleanup()).resolves.toBeUndefined();
    });

    it('logs the CLEANUP start message', async () => {
        await runCleanup();
        expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('CLEANUP'));
    });
});
