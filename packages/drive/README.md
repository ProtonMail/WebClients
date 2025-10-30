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

`useDrive` provides following properties:

- `drive`: Drive SDK instance - for more info, follow the Drive SDK documentation
- `photos`: (experimental) Photos SDK instance - for more info, follow the Drive SDK documentation
- `getLogs`: Function to get Drive logs - you can use it to include in bug reports

## Using the Drive modules or components

This shared Drive package also provides modules that builds on top of the Drive SDK to easily integrate the Drive functionality into web applications. These modules are located in one of the following folders:

- `components`: Stateless components that provides UI for standard Drive features. For example, directory tree for traversing the Drive hierarchy.
- `modules`: UI-less modules that provide logic for standard Drive features. For example, upload or download manager that includes error handling and progress tracking, or thumbnails generation.
- `modals`: Complete React components that provide UI with complete logic for standard Drive features. For example, create folder modal, sharing modal, etc.

## Compatibility rules

The Drive team is responsbile to provide stable interfaces for the Drive SDK and modules built on top of it. Any changes to the interfaces will be announced, documented, and provided with a migration support.

Only the public interface of each module is guaranteed to be stable. The team deserves the right to change the internal implementation details without a warning. Usage of non-exported features is not guaranteed to work and will not be supported, or warned about the change. Any failure because of that will not be considered as a bug and will not be fixed, it will up for the consumer to deal with the consequences.

To use only the public interface, import only directly from `@proton/drive` package, or from the index of individual modules (e.g., `@proton/drive/modules/thumbnails`).

## Metrics, Logs & Error Reporting

The Drive SDK includes automatic Sentry and metrics integration for error monitoring. It is automatically enabled when you initialize the Drive SDK and requires no additional configuration. It includes only errors and warnings from the logs and metrics. You still should handle and report any unexpected errors coming from the Drive SDK calls.
