# notifications

Escape hatch to call `createNotification` from non-React code (Zustand stores, action handlers, etc.).

## Usage

Mount `<NotificationsBridge />` as a sibling inside `<ProtonApp>` in each app entry point:

```tsx
<ProtonApp config={config}>
    <NotificationsBridge />
    {/* loading / error / main content */}
</ProtonApp>
```

Then call from anywhere outside React:

```ts
import { getNotificationsManager } from 'src/app/modules/notifications';

getNotificationsManager().createNotification({ text: 'Upload complete', type: 'success' });
```

## Why there is no risk of notifications being lost before first load

`NotificationsBridge` uses `useLayoutEffect`, which fires **synchronously after the DOM commit and before the browser paints**. This means the singleton is populated before any content is visible on screen.

No realistic code path can call `createNotification` before the bridge fires:

- Async operations (bootstrap, API calls) have not yet completed.
- Nothing has been painted yet, so no user interaction is possible.
- The singleton is set synchronously in the same commit cycle as the initial render.

If the manager is somehow called before initialisation (e.g. during SSR or in a test), `getNotificationsManager()` returns a no-op that emits a `console.warn` as a dev-time signal — it does not throw.

## Behaviour

- Before initialisation: returns a no-op manager; `createNotification` emits `console.warn`.
- After `<NotificationsBridge />` mounts: all calls are forwarded to the real `NotificationsManager`.
- After unmount: falls back to the no-op manager again.
- No conflict with `useNotifications()`: the singleton holds a reference to the same manager instance, created once by `NotificationsProvider` and never recreated.
