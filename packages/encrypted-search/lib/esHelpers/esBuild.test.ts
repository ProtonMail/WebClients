import { CryptoProxy } from '@protontech/crypto';

import { readIndexKey } from '../esIDB/configObjectStore';
import { getIndexKey } from './esBuild';
import { getESLogger } from './esLogger';
import { esSentryReport } from './esReporting';

vi.mock('@protontech/crypto', () => ({
    CryptoProxy: { decryptMessage: vi.fn() },
}));
vi.mock('../esIDB/configObjectStore', () => ({
    readIndexKey: vi.fn(),
}));
vi.mock('./esLogger', () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    return { getESLogger: () => logger };
});
vi.mock('./esReporting', () => ({
    esSentryReport: vi.fn(),
    esErrorReport: vi.fn(),
}));

describe('getIndexKey', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should resolve undefined without reporting when there is no index key', async () => {
        vi.mocked(readIndexKey).mockResolvedValue(null as any);

        await expect(getIndexKey([], 'userID')).resolves.toBeUndefined();
        expect(esSentryReport).not.toHaveBeenCalled();
        expect(getESLogger().info).toHaveBeenCalledWith('[EncryptedSearch] No index key found');
    });

    it('should report when decryption fails', async () => {
        const error = new Error('decrypt failed');
        vi.mocked(readIndexKey).mockResolvedValue('armored' as any);
        vi.mocked(CryptoProxy.decryptMessage).mockRejectedValue(error);

        await expect(getIndexKey([], 'userID')).resolves.toBeUndefined();
        expect(esSentryReport).toHaveBeenCalledWith('getIndexKey', { error });
    });
});
