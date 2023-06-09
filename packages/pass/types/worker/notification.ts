/* some localised notifications emitted from the sagas may need
 * JSX interpolations - in that case, use specific notification
 * keys so we can match them in the UI */
export enum NotificationKey {
    INACTIVE_SHARES,
}
