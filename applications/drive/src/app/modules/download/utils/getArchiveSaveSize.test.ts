import { MEMORY_DOWNLOAD_LIMIT } from '@proton/shared/lib/drive/constants';

import { getArchiveSaveSize } from './getArchiveSaveSize';

describe('getArchiveSaveSize', () => {
    it('should use the exact archive length when known', () => {
        expect(getArchiveSaveSize({ archiveLength: 1234, totalEncryptedSize: 5000, isIos: true })).toBe(1234);
    });

    it('should use the encrypted size outside of iOS', () => {
        expect(
            getArchiveSaveSize({ archiveLength: undefined, totalEncryptedSize: MEMORY_DOWNLOAD_LIMIT, isIos: false })
        ).toBe(MEMORY_DOWNLOAD_LIMIT);
    });

    it('should not give a size when the encrypted size is unknown', () => {
        expect(getArchiveSaveSize({ archiveLength: undefined, totalEncryptedSize: 0, isIos: false })).toBeUndefined();
    });

    it('should use the encrypted size on iOS when it fits in memory', () => {
        expect(getArchiveSaveSize({ archiveLength: undefined, totalEncryptedSize: 5000, isIos: true })).toBe(5000);
    });

    it('should not use the encrypted size on iOS when it is too big for memory', () => {
        expect(
            getArchiveSaveSize({ archiveLength: undefined, totalEncryptedSize: MEMORY_DOWNLOAD_LIMIT, isIos: true })
        ).toBeUndefined();
    });
});
