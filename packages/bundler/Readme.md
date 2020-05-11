# Proton Bundler

CLI tools to bundle Proton web clients for deploys.

There are 3 modes:

1. bundle (_default_): we create a bundle from the app with everything
2. bundle+deploy: same but we also deploy to a branch (_requirements_: `--branch=X` `--git`)
3. deploy: we take an existing directory `dist` and we deploy it to `--branch` (_requirements_: `--branch=X` `--only-git`)

We create during the bundle, a file `version.json` available inside `dist/assets/version.json`
ex:
```jsonc
{
    "version": "v3.16.21",
    "commit": "fcdc2d2168b69b63688e87acb52d53f30879a674",
    "branch": "mail-version",
    "buildDate": "2020-02-19T10:51:58Z",
    "release": "mail-version-v3.16.21-fcdc2d216"
    "locales": "a88cabca8bca8fff8acc88ddde0009cd398763c"
}
```

## How to install ?

```sh
$ npm i -D github:ProtonMail/proton-bundler.git#semver:^2.0.0
```

## Commands

```sh
$ proton-bundler [action:optional] <--api> <--branch> <--flow> <--appMode> <--default-branch>
```

### Actions

:warning: Default no action to bundle the app

- `hosts` : to create new deploy targets (branch) on a repository
- `changelog` : Generate a changelog based on a deploy-branch

### flags
- `--remote`: Build the current app from master via a git clone
- `--branch`: **Mandatory** ex: deploy-settings
- `--api`: Typeof branch to deploy (dev/beta/build/etc.)
- `--flow`: Type of flow (_Usefull only for WebClient_)
- `--no-lint`: Ignore lint task on deploy
- `--appMode`: Deprecated in favor or `--buildMode`
- `--buildMode`: Type of bundle npm task to run for the app (ex: "standalone" translates into `npm run bundle:standalone`)
- `--default-branch`: Default master, What's the default branch on your repository (usually master, usefull for the package-lock update)
- `--git`: At the end of the bundle we're going to commit and deploy to the branch `--branch`
- `--only-git`: We commit and deploy and existing directory `dist` to the branch `--branch`


## How to configure

You can create a custom deploy task by using a file `proton.bundler.js` at the root of your app.

### Commands

#### Lint the app (to ignore --no-lint)

You must have `$ npm run lint` available inside your app

#### Build the app

You must have `$ npm run build` available inside your app

### Documentation

We use tasks from [Listr](https://github.com/SamVerschueren/listr#usage)

Format:

```js
(argv) => {

    const tasks = (deployConfig) => ({
        hookPreTasks: [...task]
        hookPostTasks: [...task]
        hookPostTaskClone: [...task]
        hookPostTaskBuild: [...task]
    });

    const config = {
        EXTERNAL_FILES: [...<String>],
        apiUrl: <String>
    };

    return { tasks, config };
}
```

deployConfig:

- `branch: <String>` ~ branch's name
- `appMode: <String>` ~ Type of app we build, standalone or bundle (default)
- `flowType: <String>` ~ Type of deploy ('single', or 'many')
- `isRemoteBuild: <Boolean>` ~ Is it the deploy of a remote build ?

We have a context available for tasks inside ( _hookPostTasks, hookPostTaskClone, hookPostTaskBuild_ ):

- originCommit: Commit from where we create the deploy
- originBranch: Branch from where we create the deploy
- tag: Tag from where we deploy (usefull for prod)

### Ex

We want to:
- Prevent the deploy to a branch X
- Load a custom config when we deploy
- Use a custom config env when we deploy (ex: _the WebClient is using an old standard_)

```js
const path = require('path');
const { bash } = require('proton-bundler');

const { externalFiles, getDeployApi } = require('./appConfig');

function main(argv) {
    const { apiUrl } = getDeployApi(branch, argv);

    function tasks({ branch }) {

        if (/monique/.test(branch)) {
            throw new Error('You cannot deploy to this branch.');
        }

        return {
            customConfigSetup: [
                {
                    title: 'Setup config custom',
                    async task(ctx) {
                        return bash('./tasks/setupConfig.js ', process.argv.slice(2));
                    }
                }
            ]
        };
    }

    const config = {
        apiUrl,
        branch,
        EXTERNAL_FILES: externalFiles
    };

    return { config, tasks };
}

module.exports = main;
```

### Output demo

```shell
[atlas]:~/dev/taf/Angular [feat/protonBundler]
$ deploy dev

> protonmail-web@3.16.0 deploy /home/dhoko/dev/taf/Angular
> cross-env NODE_ENV=dist proton-bundler --default-branch v3 "--branch=deploy-demo" "--api=dev"

[proton-bundler] ✔ Found proton.bundler.js, we can extend the deploy
➙ branch: deploy-demo
➙ apiUrl: https://mail.protonmail.com/api
➙ appMode: bundle
➙ SENTRY: undefined

  ✔ Check env
  ✔ Check dependencies
  ✔ Clear previous dist
  ✔ Lint sources
  ✔ Setup config custom
  ✔ Extract git env for the bundle
  ✔ Pull dist branch deploy-demo
  ✔ Copy some files
  ✔ Build the application
  ✔ Generate the changelog
  ✔ Generate the version info
  ✔ Push dist to deploy-demo
 [proton-bundler] ✔ App deployment done (01:19)
```
