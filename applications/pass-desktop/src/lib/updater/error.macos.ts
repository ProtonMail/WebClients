import { UpdateErrorType } from '@proton/pass/types/desktop';

/** On macOS `autoUpdater` wraps Squirrel.Mac, and Electron forwards the underlying
 * NSError's `code` (integer) and `domain` (string) onto the emitted `Error`. We branch
 * on the stable `domain` strings first, then on well-known Apple/POSIX numeric codes.
 * Squirrel's own error codes are intentionally not matched: only their integer ordinal
 * survives into JS, which is too brittle to rely on. */
type NativeUpdaterError = Error & { code?: number; domain?: string };

const NS_FILE_WRITE_OUT_OF_SPACE = 640; // NSCocoaErrorDomain
const POSIX_ENOSPC = 28; // NSPOSIXErrorDomain

export const categorizeUpdaterError = (err: NativeUpdaterError): UpdateErrorType => {
    const { domain, code, message = '' } = err;

    const outOfSpaceByCode =
        (domain === 'NSCocoaErrorDomain' && code === NS_FILE_WRITE_OUT_OF_SPACE) ||
        (domain === 'NSPOSIXErrorDomain' && code === POSIX_ENOSPC);

    // The `ditto` unpack/copy step reports every shell failure under a single Squirrel
    // code, dropping the disk-full detail into NSError userInfo — which Electron does not
    // forward. The message (ditto's stderr) is the only surviving signal here, so the
    // substring match is scoped to that one domain.
    const outOfSpaceByMessage = domain === 'SQRLZipArchiverErrorDomain' && /No space left on device/i.test(message);

    if (outOfSpaceByCode || outOfSpaceByMessage) return UpdateErrorType.NotEnoughDiskSpace;
    if (domain === 'NSURLErrorDomain') return UpdateErrorType.DownloadFailed;

    return UpdateErrorType.InstallFailed;
};
