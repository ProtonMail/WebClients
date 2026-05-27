# Notifications Module

Sets up a `NotificationsManager` singleton to allow sending notifications outside of the React context.

## Setup

```tsx
import { useSetupNotificationManager } from '@proton/drive/modules/notifications';

const MyAppRoot = () => {
    useSetupNotificationManager();
    return <YourContent />;
};
```

## Usage

From anywhere outside/inside React context:

```ts
import { getNotificationsManager } from '@proton/drive/modules/notifications';

getNotificationsManager().createNotification({ text: 'Upload complete', type: 'success' });
```
