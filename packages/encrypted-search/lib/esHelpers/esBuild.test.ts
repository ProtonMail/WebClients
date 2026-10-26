import { CryptoProxy } from '@protontech/crypto';

import { readIndexKey } from '../esIDB/configObjectStore';
import { getIndexKey } from './esBuild';
import { getESLogger } from './esLogger';
import { esSentryReport } from './esReporting';

jest.mock('@protontech/crypto', () => ({
    CryptoProxy: { decryptMessage: jest.fn() },
}));
jest.mock('../esIDB/configObjectStore', () => ({
    readIndexKey: jest.fn(),
}));
jest.mock('./esLogger', () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    return { getESLogger: () => logger };
});
jest.mock('./esReporting', () => ({
    esSentryReport: jest.fn(),
    esErrorReport: jest.fn(),
}));

describe('getIndexKey', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should resolve undefined without reporting when there is no index key', async () => {
        jest.mocked(readIndexKey).mockResolvedValue(null as any);

        await expect(getIndexKey([], 'userID')).resolves.toBeUndefined();
        expect(esSentryReport).not.toHaveBeenCalled();
        expect(getESLogger().info).toHaveBeenCalledWith('[EncryptedSearch] No index key found');
    });

    it('should report when decryption fails', async () => {
        const error = new Error('decrypt failed');
        jest.mocked(readIndexKey).mockResolvedValue('armored' as any);
        jest.mocked(CryptoProxy.decryptMessage).mockRejectedValue(error);

        await expect(getIndexKey([], 'userID')).resolves.toBeUndefined();
        expect(esSentryReport).toHaveBeenCalledWith('getIndexKey', { error });
    });
});
