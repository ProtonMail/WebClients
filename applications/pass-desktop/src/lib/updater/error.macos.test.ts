import { UpdateErrorType } from '@proton/pass/types/desktop';

import { categorizeUpdaterError } from './error.macos';

describe('categorizeUpdaterError', () => {
    const nativeError = (props: { domain?: string; code?: number; message?: string }): Error => {
        const err = new Error(props.message ?? 'error') as Error & { domain?: string; code?: number };
        err.domain = props.domain;
        err.code = props.code;
        return err;
    };

    it('detects disk full from NSCocoaErrorDomain out-of-space code', () => {
        expect(categorizeUpdaterError(nativeError({ domain: 'NSCocoaErrorDomain', code: 640 }))).toBe(
            UpdateErrorType.NotEnoughDiskSpace
        );
    });

    it('detects disk full from POSIX ENOSPC', () => {
        expect(categorizeUpdaterError(nativeError({ domain: 'NSPOSIXErrorDomain', code: 28 }))).toBe(
            UpdateErrorType.NotEnoughDiskSpace
        );
    });

    it('detects disk full from the ditto stderr on zip-archiver failures', () => {
        const message = 'ditto: /path/Electron Framework: No space left on device';
        expect(categorizeUpdaterError(nativeError({ domain: 'SQRLZipArchiverErrorDomain', message }))).toBe(
            UpdateErrorType.NotEnoughDiskSpace
        );
    });

    it('treats other zip-archiver failures as install failures', () => {
        const message = 'ditto: /path: Permission denied';
        expect(categorizeUpdaterError(nativeError({ domain: 'SQRLZipArchiverErrorDomain', message }))).toBe(
            UpdateErrorType.InstallFailed
        );
    });

    it('maps network errors to download failures', () => {
        expect(categorizeUpdaterError(nativeError({ domain: 'NSURLErrorDomain', code: -1009 }))).toBe(
            UpdateErrorType.DownloadFailed
        );
    });

    it('maps other Squirrel domains to install failures', () => {
        expect(categorizeUpdaterError(nativeError({ domain: 'SQRLInstallerErrorDomain', code: 1 }))).toBe(
            UpdateErrorType.InstallFailed
        );
    });

    it('falls back to install failed when no domain is present', () => {
        expect(categorizeUpdaterError(nativeError({ message: 'something went wrong' }))).toBe(
            UpdateErrorType.InstallFailed
        );
    });
});
