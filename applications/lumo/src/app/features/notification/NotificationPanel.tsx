import { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { markNotificationPanelDismissed } from '../../util/notificationPanelStorage';
import { canShowWebComposer } from '../../util/userAgent';

import './Notification.scss';

export interface NotificationProps {
    title?: string;
    text?: string;
    actionLabel?: string;
    /** External link opened in a new tab. Provide this OR `onAction`. */
    actionUrl?: string;
    /** Internal action (e.g. router navigation). Takes precedence over `actionUrl`. */
    onAction?: () => void;
    onDismiss?: () => void;
    showNewBadge?: boolean;
    /** When true (default), dismissing persists to the shared survey storage key. */
    persistDismiss?: boolean;
}

export default function NotificationPanel({
    title = c('collider_2025: Title').t`Got a minute?`,
    text = c('collider_2025: Description').t`Your experience shapes ${LUMO_SHORT_APP_NAME}. Tell us what you think.`,
    actionLabel = c('collider_2025: Action').t`Share your thoughts`,
    actionUrl,
    onAction,
    showNewBadge = false,
    persistDismiss = true,
    onDismiss,
}: NotificationProps) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const { nativeComposer: nativeComposerEnabled } = useLumoFlags();

    // Native composers occupy the bottom of the WebView on both mobile platforms.
    const isCoveredByNativeComposer = !canShowWebComposer(nativeComposerEnabled);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const finishDismiss = () => {
        if (persistDismiss) {
            markNotificationPanelDismissed();
        }
        setExiting(true);
        setTimeout(() => {
            setVisible(false);
            onDismiss?.();
        }, 280);
    };

    const handleAction = () => {
        finishDismiss();
        onAction?.();
    };

    if (!visible && !exiting) return null;

    return (
        <>
            <div
                className={clsx(
                    'notification-panel border lumo-border radius-12 lumo-bg-panel',
                    exiting ? 'notif-exit' : 'notif-enter',
                    isCoveredByNativeComposer && 'notification-panel--native-composer'
                )}
            >
                <button
                    className="notif-close py-0.5 px-1 radius-4 lumo-color-glyph-mid"
                    onClick={finishDismiss}
                    aria-label={
                        // translator: Accessible button label for closing a notification.
                        c('collider_2025:Label').t`Dismiss`
                    }
                >
                    ✕
                </button>

                <div className="flex flex-row flex-nowrap gap-3 items-start">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex flex-row flex-nowrap gap-2 items-center mb-1">
                            <span className="notification-panel-title lumo-label-medium lumo-color-glyph">{title}</span>
                            {showNewBadge && (
                                <span className="notification-panel-title-new radius-4 lumo-label-small lumo-color-glyph-brand-text">{c(
                                    'collider_2025: Badge'
                                ).t`New`}</span>
                            )}
                        </div>

                        <p className="notification-panel-text mt-0 mb-3 mx-0 lumo-body-small lumo-color-glyph-mid">
                            {text}
                        </p>

                        <div className="flex flex-row flex-nowrap gap-2">
                            {onAction ? (
                                <button
                                    type="button"
                                    className="notif-action radius-8 lumo-label-medium lumo-color-control-brand-text lumo-bg-control-brand-fill"
                                    id="notification-panel-action"
                                    onClick={handleAction}
                                >
                                    {actionLabel}
                                </button>
                            ) : (
                                <a
                                    className="notif-action radius-8 lumo-label-medium lumo-color-control-brand-text lumo-bg-control-brand-fill"
                                    id="notification-panel-action"
                                    href={actionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={finishDismiss}
                                >
                                    {actionLabel}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
