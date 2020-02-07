You will need:
- bash
- node (mini latest LTS)
- npm (latest too, it's better)



>**⚠ If you use Windows plz follow this document before anything else [how to prepare Windows](https://github.com/ProtonMail/proton-shared/wiki/setup-windows)**



## How to dev 1

1. Clone this repository
2. Run `$ npm i`
3. `$ npm start`

It will give you the URL where it's available.

> You can login via `/login`

## Sync translations [App  to crowdin]

You can sync them via `$ npm run i18n:upgrade`, it will:
- Extract translations
- Push them to crowndin
- Create a commit with them on the repo


## How to deploy

- `$ npm run deploy -- --branch=<deploy-X> --api=<target>`
_Deploy the app as /$config_

`$config`: See package.json config.publicPathFlag

- `$ npm run deploy:standalone -- --branch=<deploy-X> --api=<target>`
_Deploy the app as deploy + /login_

Based on [proton-bundler](https://github.com/ProtonMail/proton-bundler)

## Sync translations [Crowdin to our App]

To get latest translations available on crowdin, you can run `$ npm run i18n:getlatest`.
It will:
- Get list of translations available (default same as proton-i18n crowdin --list --type --limit=95)
- Upgrade our translations with ones from crowdin
- Store a cache of translations available in the app
- Export translations as JSON
- Commit everything

> :warning: If you want to get only a **custom** list of translations, configure it inside `po/i18n.txt` and run `$ npm run i18n:getlatest -- --custom`

## :rocket: Create a new version (before deploy)

This command will:

- Manage dependencies (detect and update the lock)
- Take care of active npm links
- run npm version

```sh
$ npx proton-version <patch|minor|major>
```
> Default is patch

If you want to force the update of all dependencies add the flag `--all`;

By default it provides a prompt and ask you what you want to update etc.

> If you have an active `npm link` it will remove it from your node_modules.