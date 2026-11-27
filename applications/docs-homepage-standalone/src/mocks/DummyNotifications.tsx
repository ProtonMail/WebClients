import { useState } from 'react';

import type { HomepageDependencies } from 'proton-docs/homepage';

type Notification = Parameters<HomepageDependencies['createNotification']>[0];

function DummyNotifications({ notifications }: { notifications: Notification[] }) {
    return (
        <ul
            style={{
                position: 'fixed',
                top: 16,
                left: 16,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}
        >
            {notifications.map(({ type, text, action }, index) => (
                // Errors as alerts, the rest as status messages, as screen readers announce them.
                <li
                    key={index}
                    role={type === 'error' ? 'alert' : 'status'}
                    style={{ background: 'yellow', border: '1px solid black', padding: '8px 12px' }}
                >
                    {text}
                    {action && (
                        <button type="button" onClick={action.onClick} style={{ marginLeft: 8 }}>
                            {action.label}
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}

/**
 * Stands in for the Docs app's notifications, which come from Proton's components: `createDummyNotification` adds a
 * notification to `dummyNotifications`, which the caller renders. They stay until the page reloads.
 */
export function useDummyNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    // Stable, as the homepage asks: a new function would reload the recents.
    const [createDummyNotification] = useState(
        (): HomepageDependencies['createNotification'] => (notification) =>
            setNotifications((current) => [...current, notification])
    );

    const dummyNotifications = <DummyNotifications notifications={notifications} />;
    return { dummyNotifications, createDummyNotification };
}
