# Proton Bundler

CLI tools to bundle Proton web clients for deploys.

## Commands

```sh
$ proton-bundler [action:optional] <--api> <--buildMode>
```

### Actions

### flags (same as npm run build)

-   `--api`: Typeof branch to deploy (dev/beta/build/etc.)
-   `--buildMode`: Type of bundle npm task to run for the app (ex: "standalone" translates into `npm run bundle:standalone` (options: `standalone` = with login page or `sso`: without loginpage)
-   `--verbose`
