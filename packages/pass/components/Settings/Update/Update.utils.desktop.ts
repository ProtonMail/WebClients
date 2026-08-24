import { c } from 'ttag';

import type { MaybeNull } from '../../../types';
import { UpdateErrorType } from '../../../types/desktop';

export const getErrorLabel = (type: MaybeNull<UpdateErrorType>): string => {
    if (type === null) return c('Error').t`Update failed`;
    const typeLabel = (() => {
        switch (type) {
            case UpdateErrorType.ManifestUnavailable:
                return c('Error').t`could not reach the update server`;
            case UpdateErrorType.ManifestInvalid:
                return c('Error').t`invalid update manifest`;
            case UpdateErrorType.DownloadFailed:
                return c('Error').t`could not download the update`;
            case UpdateErrorType.InstallFailed:
                return c('Error').t`could not install the update`;
            case UpdateErrorType.NotEnoughDiskSpace:
                return c('Error').t`not enough disk space`;
        }
    })();
    return c('Error').t`Update failed (${typeLabel}).`;
};
