import { useEffect, useState } from 'react';

import { isModalOpen } from '@proton/shared/lib/busy';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import type { Maybe } from '../../types';
import { InAppNotificationDisplayType } from '../../types';
import type { InAppNotification } from '../../types/data/notification';
import { cancelable } from '../../utils/fp/promises';
import { useStatefulRef } from '../useStatefulRef';

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
