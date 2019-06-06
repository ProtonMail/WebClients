# Proton Bundler

CLI tools to bundle Proton web clients for deploys.

Default tasks:
- Save dependencies (update package-lock.json when we deploy a QA version or release )
- Clear previous dist dir
- Lint app before bundler
- Setup config for the app
- Extract current git env (origin branch,tag,commit)
- Pull deploy branch to the dist dir
- Copy htaccess
- [beta/prod] Upgrade translations inside the app (json files)
- Build the app
- Push to the deploy branch
- Upgrade crowdin with latest translations from the app

## How to install ?

```sh
$ npm i -D github:ProtonMail/proton-bundler.git#semver:^1.0.0
``` 

## Commands

```sh
$ proton-bundler [action:optional] <--api> <--branch> <--flow> <--i18n> <--appMode> <--default-branch>
``` 

### Actions

:warning: Default no action to bundle the app

- `hosts` : to create new deploy targets (branch) on a repository

### flags
- `--branch`: **Mandatory** ex: deploy-settings 
- `--api`: Typeof branch to deploy (dev/beta/build/etc.)
- `--flow`: Type of flow (_Usefull only for WebClient_)
- `--i18n`: To force the upgrade i18n task inside the app during any deploy (default only for prod/beta if not ci)
- `--appMode`: Type of bundle for the app (ex: standalone is an option for protonmail-settings)
- `--default-branch`: What's the default branch on your repository (usually master)


## How to configure

You can create a custom deploy task by using a file `proton.bundler.js` at the root of your app.

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
- `isCI: <Boolean>`
- `flowType: <String>` ~ Type of deploy ('single', or 'many')
- `forceI18n: <Boolean>`

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
