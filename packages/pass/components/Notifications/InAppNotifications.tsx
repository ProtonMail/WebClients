import type { FC } from 'react';
import { useCallback } from 'react';

import { HOUR } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useOfflineSetup } from '../../hooks/auth/useOfflineSetup';
import { useInAppNotificationVisibility } from '../../hooks/notifications/useInAppNotificationVisibility';
import { usePrompt } from '../../hooks/notifications/usePrompt';
import { useEpoch } from '../../hooks/useEpoch';
import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectActiveNotification } from '../../store/notifications/in-app/selectors';
import { InAppNotificationDisplayType } from '../../types/api/pass';
import type { MaybeNull } from '../../types/utils';
import { useAuthStore } from '../Core/AuthStoreProvider';
import { useOnline } from '../Core/ConnectivityProvider';
import { InAppNotificationBanner, NotificationBanner } from './InAppNotificationBanner';
import { InAppNotificationModal } from './InAppNotificationModal';
import type { InAppNotificationRenderProps } from './WithInAppNotification';

const getNotificationComponent = (
    displayType: InAppNotificationDisplayType
): MaybeNull<FC<InAppNotificationRenderProps>> => {
    switch (displayType) {
        case InAppNotificationDisplayType.BANNER:
            return InAppNotificationBanner;
        case InAppNotificationDisplayType.MODAL:
            return InAppNotificationModal;
        /* Promo modal is rooted in the promo menu button to keep state local */
        case InAppNotificationDisplayType.PROMO:
        default:
            return null;
    }
};

/** Slot arbitration: the backend notification wins the slot; the
 * client-side prompt falls back when the backend has nothing to
 * display. Surfaces render whatever this resolves to. */
export const InAppNotifications: FC = () => {
    const authStore = useAuthStore();
    const online = useOnline();

    const now = useEpoch(HOUR);
    const notification = useMemoSelector(selectActiveNotification, [now]);
    const visible = useInAppNotificationVisibility(notification);
    const [setup, loading] = useOfflineSetup();

    const client = { offlineComponents: authStore?.hasOfflineComponents() ?? true, online };
    const { prompt, dismiss } = usePrompt('offline-banner', client);

    const onPrimary = useCallback(() => {
        if (prompt?.primary.action === 'enable-offline') setup().catch(noop);
    }, [prompt, setup]);

    /* Backend notification takes the slot; the prompt is the fallback */
    if (notification) {
        const Component = getNotificationComponent(notification.content.displayType);
        if (Component) return visible ? <Component dense={EXTENSION_BUILD} notification={notification} /> : null;
    }

    if (!prompt) return null;

    return (
        <NotificationBanner
            cta={{ disabled: loading, text: prompt.primary.label, onClick: onPrimary }}
            dense={EXTENSION_BUILD}
            title={prompt.title}
            message={prompt.body}
            onDismiss={dismiss}
        />
    );
};
