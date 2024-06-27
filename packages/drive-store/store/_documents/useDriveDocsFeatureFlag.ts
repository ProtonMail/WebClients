import { useFlag } from '@proton/components/containers';

import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';
import { useAbortSignal } from '../_views/utils';

/**
 * Contains logic relating to the availability of Proton Docs.
 */
export const useDriveDocsFeatureFlag = () => {
    const defaultSignal = useAbortSignal([]);
    const { isSharedWithMe } = useDirectSharingInfo();

    const disabled = useFlag('DriveDocsDisabled');
    const active = useFlag('DriveDocs');

    const isDocsEnabled = !disabled && active;

    const canUseDocs = async (shareId: string, abortSignal: AbortSignal = defaultSignal): Promise<boolean> => {
        if (disabled) {
            return false;
        }

        try {
            const isShared = await isSharedWithMe(abortSignal, shareId);

            return active || isShared;
        } catch {
            // Fallback to the flag value if we cannot fetch the shared status
            return isDocsEnabled;
        }
    };

    return {
        /**
         * Context-agnostic feature flag for displaying UI related to Docs.
         */
        isDocsEnabled,
        /**
         * Context aware function returning Proton Docs availability.
         *
         * Kill-switch will **ALWAYS** disable the feature.
         *
         * However, we allow using the feature if the document is not owned by the user.
         *
         * This allows users without the feature flag to still open Docs, even if
         * they themselves aren't part of the rollout yet.
         */
        canUseDocs,
    };
};
