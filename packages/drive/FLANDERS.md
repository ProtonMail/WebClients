# Drive package usage rules

These rules cover code that uses `@proton/drive`, in any app or package. Changes to `packages/drive/` itself follow the "Drive" section of the root `FLANDERS.md`.

## Public API only

Only `@proton/drive/sdk` and `@proton/drive/public/*` are public (see "External API" in `packages/drive/README.md`); lint blocks the other imports, except in `applications/drive/` and `packages/drive-store/`. Flag new private `@proton/drive/*` imports in `packages/drive-store/`, any `eslint-disable` or `oxlint-disable` of `proton/restricted-imports` that lets an import from `@proton/drive` through, and any relative import reaching into `packages/drive/` from outside it. Suggest the public API, or discussing with the Drive team if no public equivalent exists.

## Using the SDK

- The SDK is configured once at app entry with `useDrive().init(...)`. Flag a second `init` call, or SDK use before `init`.
- Core events are subscribed once at bootstrap with `subscribeSdkDriveEvents`, passing the app's `EventManager`, and unsubscribed on unmount. Flag a missing unsubscribe or a second subscription.
- Errors from SDK calls must be handled and reported by the caller. Flag calls whose errors are swallowed or not shown to the user.
