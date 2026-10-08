# @proton/console

Pages of the admin Console (`proton-console`) that Account and VPN settings also render.

## When to use it?

- If a settings page is moving to the admin Console, put its route config, shared predicates and route component here, so that `proton-console`, `proton-account` and `proton-vpn-settings` render it from the same source.
- Keep the Console shell (`MainContainer`, sidebar, store, bootstrap) in `applications/console`, so Account and VPN settings never pull in the Console runtime.
- Leave the page's underlying components in `@proton/components` unless the migration plan says otherwise.

Console plans live in `applications/console/plans/`.
