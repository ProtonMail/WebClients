import { useRef } from 'react';

import { useUser } from '@proton/components/hooks';
import { DAY, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

const useShowUpsellBanner = (labelID: string, otherBannerDisplayed: boolean) => {
    const [user] = useUser();
    // Ref that we set to false on the upsell banner unmount so that we can display the banner only the first time
    const needToShowUpsellBanner = useRef<boolean>(true);

    const userCreateTime = user.CreateTime || 0;

    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX;

    const threeDaysAfterCreationDate = userCreateTime * 1000 + 3 * DAY;

    /* Display upsell banners if
    - User is free
    - The user created his account more than 3 days ago
    - User is in Inbox
    - User is seeing the banner for the first time in the session
    - No other banner is shown in the message list
     */
    const canDisplayUpsellBanner =
        !user.hasPaidMail &&
        Date.now() > threeDaysAfterCreationDate &&
        isInbox &&
        needToShowUpsellBanner.current &&
        !otherBannerDisplayed;

    return { canDisplayUpsellBanner, needToShowUpsellBanner };
};

export default useShowUpsellBanner;
