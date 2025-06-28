# Drive SDK integration with Web monorepo

This provides the Drive SDK functionality to all Proton applications.

The Drive SDK lives in separate repository and is imported as standard library. The lib folder contains the Drive SDK dependencies connecting the Drive SDK to the Web monorepo.

## Configure the Drive SDK

To use the Drive SDK in your application, you need to configure it first using your app's configuration such as `APP_NAME` and `APP_VERSION` (used for API calls), or the user's plan (used for metrics). This configuration is necessary to initialize the Drive SDK and should be done before using any Drive SDK features.

This is typically done in the main entry point of your application, such as `MainContainer`. Note: This function should be called only once at the start of your application. Second attempt will throw an error.

```javascript
import { useUser } from '@proton/account/user/hooks';
import { useDrive } from '@proton/drive';
import { isPaid } from '@proton/shared/lib/user/helpers';

import * as config from './config';

function App() {
    const [user] = useUser();
    const { init } = useDrive();

    useEffect(() => {
        const userPlan = isPaid(user) ? 'paid' : 'free'; // other options: 'anonymous' (not logged in) and 'unknown' (default)
        init({
            appName: config.APP_NAME,
            appVersion: config.APP_VERSION,
            userPlan,
        });
    }, []);

    return <div>{/* Your app components */}</div>;
}
```

## Using the Drive SDK

After configuring the Drive SDK, you can use it in your application.

```javascript
import { useDrive } from '@proton/drive';

function useYourApp() {
    const { drive } = useDrive();

    // Example: Get the user's root folder in Drive
    const fetchRootFolder = async () => {
        try {
            const rootNode = await drive.getMyFilesRootFolder();
            console.log('Root folder:', rootNode);
        } catch (error) {
            console.error('Error fetching root folder:', error);
        }
    };

    // ...
}
```

Use only imports from `@proton/drive` in your app. Do not import anything else from `@proton/drive` or from Drive SDK directly (including Drive web client). In case of missing feature, please ask for it to be exposed. Usage of non-exported features is not guaranteed to work and will not be supported, or warned about the change.

`useDrive` provides following properties:

- `drive`: Drive SDK instance - for more info, follow the Drive SDK documentation
- `getLogs`: Function to get Drive logs - you can use it to include in bug reports
- `internal`: Internal functions intended for Drive web client only to help with backward compatibility - it will be removed once Drive web fully migrates to Drive SDK

## Metrics, Logs & Error Reporting

### Sentry integration

The Drive SDK includes automatic Sentry integration for error monitoring through the [`SentryLogHandler`](./lib/logHandlers/sentryLogHandler.ts) initialized inside the [`initTelemetry()`](./lib/telemetry.ts) function.

The Sentry integration is automatically enabled when you initialize the Drive SDK and requires no additional configuration. So you don't need to catch any errors coming from the Drive SDK.
