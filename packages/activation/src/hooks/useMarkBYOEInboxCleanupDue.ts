import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useFlag } from '@proton/unleash/useFlag';

/**
 * Remembers that a BYOE connection started an import, so Mail can offer the inbox cleanup later.
 * Failing to save it must never affect the connection, so errors are ignored.
 */
const useMarkBYOEInboxCleanupDue = () => {
    const isInboxCleanupEnabled = useFlag('InboxBringYourOwnEmailCleanup');
    const { update } = useFeature<boolean>(FeatureCode.BYOEInboxCleanupModal, false);

    const markInboxCleanupDue = async ({ importEmails }: { importEmails: boolean }) => {
        if (!isInboxCleanupEnabled || !importEmails) {
            return;
        }

        try {
            await update(true);
        } catch {}
    };

    return markInboxCleanupDue;
};

export default useMarkBYOEInboxCleanupDue;
