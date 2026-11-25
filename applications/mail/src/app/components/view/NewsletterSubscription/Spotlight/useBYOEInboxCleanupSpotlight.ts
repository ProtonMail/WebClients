import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useFlag } from '@proton/unleash/useFlag';

import useFinishedBYOEImportSenders from '../../../../hooks/useFinishedBYOEImportSenders';

const SPOTLIGHT_FEATURE = FeatureCode.BYOEInboxCleanupSpotlight;

/**
 * Points to Mailing lists once the import into a newly connected BYOE address has finished and the inbox cleanup has
 * senders to offer, using `useFinishedBYOEImportSenders` with its own feature code. Mounted with the Mailing lists item,
 * so it only runs while the item is visible, and the spotlight stays due otherwise.
 *
 * `useSpotlightShow` skips it for this load when another spotlight, a modal or a dropdown is already showing, and it
 * stays due for the next load.
 */
export const useBYOEInboxCleanupSpotlight = () => {
    const isCleanupEnabled = useFlag('InboxBringYourOwnEmailCleanup');
    const senders = useFinishedBYOEImportSenders(SPOTLIGHT_FEATURE, true);
    // Set once someone has opened Mailing lists and closed its welcome window
    const { feature: mailingListsOnboarding, loading: loadingMailingListsOnboarding } = useFeature<boolean>(
        FeatureCode.NewsletterSubscriptionViewOnboarding,
        isCleanupEnabled
    );

    // Waits for the Mailing lists welcome value, so the copy doesn't switch once the spotlight is on screen
    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        SPOTLIGHT_FEATURE,
        !!senders && !loadingMailingListsOnboarding
    );
    const shouldShowSpotlight = useSpotlightShow(show, 0);
    const isNewToMailingLists = mailingListsOnboarding?.Value !== true;

    return { shouldShowSpotlight, isNewToMailingLists, onDisplayed, onClose };
};
