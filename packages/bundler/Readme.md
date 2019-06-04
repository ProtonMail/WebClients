# Proton Bundler

CLI tools to bundle Proton web clients for deploys

## How to install ?

```sh
$ npm i -D github:ProtonMail/proton-bundler.git#semver:^1.0.0
``` 

## Commands

```sh
$ proton-bundler <api> <branch> <flow> <i18n> <appMode>
``` 

- `--branch`: **Mandatory** ex: deploy-settings 
- `--api`: Typeof branch to deploy (dev/beta/build/etc.)
- `--flow`: Type of flow (_Usefull only for WebClient_)
- `--i18n`: To force the upgrade i18n task inside the app during any deploy (default only for prod/beta if not ci)
- `--appMode`: Type of bundle for the app (ex: standalone is an option for protonmail-settings)


## How to configure

You can create a custom deploy task by using a file `proton.bundler.js` at the root of your app.

Ex: _To validate a branch when we deploy, href from the WebClient_

```js
module.exports = ({ branch }, argv) => {
    if (/cobalt/.test(branch) && !argv.qaforce) {
        const msg = [
            `⛔ Do not use [${branch}], it is the QA Branch`,
            `Do not update cf wiki server dev`,
            'To force update use the flag --qaforce'
        ].join('\n');
        throw new Error(msg);
    }
};
```
### Documentation

We use tasks from [Listr](https://github.com/SamVerschueren/listr#usage)

Format:
```js
  (deployConfig, argv) => {
      return {
          EXTERNAL_FILES,
          hookPreTasks: [...task]
          hookPostTasks: [...task]
          hookPostTaskClone: [...task]
          hookPostTaskBuild: [...task]
      }
  }
```
deployConfig:

    - branch: <String> ~ branch's name
    - appMode: <String> ~ Type of app we build, standalone or bundle (default)
    - isCI: <Boolean>
    - flowType: <String> ~ Type of deploy ('single', or 'many')
    - forceI18n: <Boolean>
    - EXTERNAL_FILES: <Array> ~ List of assets to copy before the build

We have a context available for tasks inside ( _hookPostTasks, hookPostTaskClone, hookPostTaskBuild_ ):

    - originCommit: Commit from where we create the deploy
    - originBranch: Branch from where we create the deploy
    - tag: Tag from where we deploy (usefull for prod)

