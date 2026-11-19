// No React components here: the search worker imports this index, and a component's styles cannot load in a worker.
export { getNotificationsManager, setNotificationsManager } from './internal/notifications.singleton';
export { useSetupNotificationManager } from './internal/useSetupNotificationManager';
