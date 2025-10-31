import { useEffect, useState } from 'react';

import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import type { Maybe } from '@proton/pass/types';
import { InAppNotificationDisplayType } from '@proton/pass/types';
import type { InAppNotification } from '@proton/pass/types/data/notification';
import { cancelable } from '@proton/pass/utils/fp/promises';
import { isModalOpen } from '@proton/shared/lib/busy';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

export const useInAppNotificationVisibility = (notification: Maybe<InAppNotification>) => {
    /** Create a stable key to prevent effect retriggering when notification object changes
     * but represents the same notification (eg: during force sync operations) */
    const notificationKey = notification ? `${notification.id}-${notification.state}` : 'noop';
    const [visible, setVisible] = useState(false);
    /** Ref ensures we don't check for open modals if there's already an ongoing notification modal */
    const visibleRef = useStatefulRef(visible);

    useEffect(() => {
        const checkNotificationDisplay = async (): Promise<boolean> => {
            if (!notification) return false;
            const { displayType } = notification.content;
            const modal = displayType === InAppNotificationDisplayType.MODAL;
            const ensureNoModals = !visibleRef.current && modal;

            /** Small delay to allow any asynchronously opening modals (eg: onboarding)
             * to complete before checking if notification modal can be displayed */
            await wait(ensureNoModals ? 1_500 : 0);
            return !(ensureNoModals && isModalOpen());
        };

        const { cancel, run } = cancelable(checkNotificationDisplay);
        run().then(setVisible).catch(noop);

        return cancel;
    }, [notificationKey]);

    return visible;
};
