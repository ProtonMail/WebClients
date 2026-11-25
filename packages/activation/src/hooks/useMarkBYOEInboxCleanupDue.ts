import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

/**
 * Remembers that a BYOE connection started an import, so Mail can offer the inbox cleanup and the
 * Mailing lists spotlight later. Failing to save either must never affect the connection or the other
 * save, so each error is ignored on its own.
 */
const useMarkBYOEInboxCleanupDue = () => {
    const isInboxCleanupEnabled = useFlag('InboxBringYourOwnEmailCleanup');
    const { update: updateCleanup } = useFeature<boolean>(FeatureCode.BYOEInboxCleanupModal, false);
    const { update: updateSpotlight } = useFeature<boolean>(FeatureCode.BYOEInboxCleanupSpotlight, false);

    const markInboxCleanupDue = async ({ importEmails }: { importEmails: boolean }) => {
        if (!isInboxCleanupEnabled || !importEmails) {
            return;
        }

        await Promise.all([updateCleanup(true).catch(noop), updateSpotlight(true).catch(noop)]);
    };

    return markInboxCleanupDue;
};

export default useMarkBYOEInboxCleanupDue;
