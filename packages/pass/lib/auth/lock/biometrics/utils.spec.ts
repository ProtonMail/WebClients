import { BIOMETRICS_KEY } from '@proton/pass/constants';
import {
    BIOMETRICS_KEY_VERSION_PREFIX,
    fromBiometricsEncryptedOfflineKD,
    inferBiometricsStorageKey,
    intoBiometricsEncryptedOfflineKD,
} from '@proton/pass/lib/auth/lock/biometrics/utils';
import type { AuthStore } from '@proton/pass/lib/auth/store';

describe('Biometrics utils', () => {
    describe('`intoBiometricsEncryptedOfflineKD`', () => {
        test('should generate a biometric `encryptedOfflineKD` with correct prefix', () => {
            const encryptedOfflineKD = 'testEncryptedOfflineKD';
            const result = intoBiometricsEncryptedOfflineKD(encryptedOfflineKD);
            expect(result).toBe(`${BIOMETRICS_KEY_VERSION_PREFIX}${encryptedOfflineKD}`);
        });
    });

    describe('`fromBiometricsEncryptedOfflineKD`', () => {
        test('should handle version 1 correctly', () => {
            const encryptedOfflineKD = 'testKeyWithoutPrefix';
            const result = fromBiometricsEncryptedOfflineKD(encryptedOfflineKD);
            expect(result).toEqual({ key: 'testKeyWithoutPrefix', version: 1 });
        });

        test('should extract version 2 correctly', () => {
            const encryptedOfflineKD = 'BIOMETRICS::V2::testKey';
            const result = fromBiometricsEncryptedOfflineKD(encryptedOfflineKD);
            expect(result).toEqual({ key: 'testKey', version: 2 });
        });
    });

    describe('`inferBiometricsStorageKey`', () => {
        const mockAuthStore = {
            getLocalID: jest.fn(),
            getEncryptedOfflineKD: jest.fn(),
        } as unknown as jest.Mocked<AuthStore>;

        beforeEach(() => {
            mockAuthStore.getLocalID.mockClear();
            mockAuthStore.getEncryptedOfflineKD.mockClear();
        });

        test('should return `BIOMETRICS_KEY` for version 1', () => {
            mockAuthStore.getLocalID.mockReturnValue(0);
            mockAuthStore.getEncryptedOfflineKD.mockReturnValue('version1Key');
            expect(inferBiometricsStorageKey(mockAuthStore)).toBe(BIOMETRICS_KEY);
        });

        test('should return `BIOMETRICS_KEY::localID` for version 2', () => {
            mockAuthStore.getLocalID.mockReturnValue(0);
            mockAuthStore.getEncryptedOfflineKD.mockReturnValue('BIOMETRICS::V2::version2Key');
            expect(inferBiometricsStorageKey(mockAuthStore)).toBe(`${BIOMETRICS_KEY}::0`);
        });

        test('should throw an error if `LocalID` is missing', () => {
            mockAuthStore.getLocalID.mockReturnValue(undefined);
            mockAuthStore.getEncryptedOfflineKD.mockReturnValue('some-key');
            expect(() => inferBiometricsStorageKey(mockAuthStore)).toThrow();
        });

        test('should throw an error if `encryptedOfflineKD` is missing', () => {
            mockAuthStore.getLocalID.mockReturnValue(0);
            mockAuthStore.getEncryptedOfflineKD.mockReturnValue(undefined);
            expect(() => inferBiometricsStorageKey(mockAuthStore)).toThrow();
        });
    });
});
