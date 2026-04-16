import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { markNotificationPanelDismissed } from '../../util/notificationPanelStorage';

import './Notification.scss';

export interface NotificationProps {
    title?: string;
    text?: string;
    actionLabel?: string;
    actionUrl: string;
    onDismiss?: () => void;
    showNewBadge?: boolean;
}

export default function NotificationPanel({
    title = c('collider_2025: Title').t`Got a minute?`,
    text = c('collider_2025: Description').t`Your experience shapes ${LUMO_SHORT_APP_NAME}. Tell us what you think.`,
    actionLabel = c('collider_2025: Action').t`Share your thoughts`,
    actionUrl,
    showNewBadge = false,
    onDismiss,
}: NotificationProps) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const finishDismiss = () => {
        markNotificationPanelDismissed();
        setExiting(true);
        setTimeout(() => {
            setVisible(false);
            onDismiss?.();
        }, 280);
    };

    if (!visible && !exiting) return null;

    return (
        <>
            <div className={'notification-panel border border-weak ' + (exiting ? 'notif-exit' : 'notif-enter')}>
                <button className="notif-close" onClick={finishDismiss} aria-label="Dismiss">
                    ✕
                </button>

                <div className="flex flex-row flex-nowrap gap-3 items-start">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex flex-row flex-nowrap gap-2 items-center mb-1">
                            <span className="notification-panel-title">{title}</span>
                            {showNewBadge && (
                                <span className="notification-panel-title-new">{c('collider_2025: Badge').t`New`}</span>
                            )}
                        </div>

                        <p className="notification-panel-text">{text}</p>

                        <div className="flex flex-row flex-nowrap gap-2">
                            <a
                                className="notif-action"
                                id="notification-panel-action"
                                href={actionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={finishDismiss}
                            >
                                {actionLabel}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
