import { useEffect, useRef, useState } from 'react';

import { useUser } from '@proton/components/hooks';
import { DAY, MAILBOX_LABEL_IDS, MONTH } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const useShowUpsellBanner = (labelID: string) => {
    const [user] = useUser();
    // Ref that we set to false on the upsell banner unmount so that we can display the banner only the first time
    const needToShowUpsellBanner = useRef<boolean>(true);

    /**
     * Users can dismiss the banner. However, we want to show it again every month
     * A value is stored in the localStorage so that we know if we need to show it again or not
     * - If no value is set, user did not click on dismiss => We want to show the banner (if other conditions are valid)
     * - If value is set
     *      - If it was less than a month ago => Hide the banner
     *      - If it was more than a month ago => Show the banner (if other conditions are valid)
     */
    const [showAgain, setShowAgain] = useState(false);

    const userCreateTime = user.CreateTime || 0;

    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX;

    const threeDaysAfterCreationDate = userCreateTime * 1000 + 3 * DAY;

    /* Display upsell banners if
    - User is free
    - The user created his account more than 3 days ago
    - User is in Inbox
    - User is seeing the banner for the first time in the session
    - No other banner is shown in the message list
    - If a value is found in the localStorage that should trigger a new display
     */
    const canDisplayUpsellBanner =
        user.isFree &&
        Date.now() > threeDaysAfterCreationDate &&
        isInbox &&
        needToShowUpsellBanner.current &&
        showAgain;

    const handleDismissBanner = () => {
        // Set the ref to false so that we hide the banner and update the localStorage value
        needToShowUpsellBanner.current = false;
        setShowAgain(false);
        const now = Date.now();

        setItem('DismissedMailUpsellBanner', now.toString());
    };

    const handleNeedsToShowBanner = (storedTime: number) => {
        const today = Date.now();
        const limitInterval = 1 * MONTH;

        return storedTime + limitInterval < today;
    };

    // Get the value in the localStorage
    useEffect(() => {
        try {
            const storedTime = getItem('DismissedMailUpsellBanner');
            if (storedTime) {
                setShowAgain(handleNeedsToShowBanner(parseInt(storedTime)));
            } else {
                // If no value found, the user did not click on dismiss => we want to show the banner
                setShowAgain(true);
            }
        } catch (e: any) {
            console.error(e);
        }
    }, []);

    return { canDisplayUpsellBanner, needToShowUpsellBanner, handleDismissBanner };
};

export default useShowUpsellBanner;
