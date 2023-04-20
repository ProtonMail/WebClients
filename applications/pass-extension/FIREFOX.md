# Proton Pass 🔥🦊

## Firefox Extension Reviewers

Below are the requirements and build steps for our ProtonPass extension release. Please replace `{version}` and `{commit}` with the appropriate values when following the steps.

### Requirements

Before building the extension, please ensure that you have the following versions installed:

-   node v19.5.0
-   npm v9.3.1
-   yarn v3.5.0

### File info

-   `ProtonPass-{version}-{commit}-FF.zip` : firefox add-on release
-   `ProtonPass-{version}-{commit}-FF-sources.zip` : firefox add-on source files

### Build Steps

To build the Firefox version of the ProtonPass extension, please follow these steps:

1.  Unzip `ProtonPass-{version}-{commit}-FF-sources.zip`
2.  Navigate to the unzipped folder in your terminal: `cd ProtonPass-{version}-{commit}-FF`
3.  Install dependencies: `yarn`
4.  Navigate to the extension folder: `cd applications/pass-extension`
5.  Build the Firefox addon: `yarn run build:ff`
6.  Build files are located at `applications/pass-extension/dist`

---

## Running locally

> ⚠️ this does not apply to reviewers

Build the extension locally with the correct environment variables :

```sh
BUILD_TARGET=firefox yarn run build
```

If you need hot-reload and runtime reloading capabilities :

```sh
# HMR only
BUILD_TARGET=firefox yarn start

# HMR + runtime reloading on code change
BUILD_TARGET=firefox yarn start:reload
```

### Running a temporary add-on

1. Open firefox and navigate to `about:debugging`
2. Click on "_This Firefox_"
3. Click on "_Load Temporary Add-On_" and chose the `dist/manifest.json`
4. Right click on the extension icon in the toolbar and select "_Manage extension_"
5. Go to the permission tab and enable all necessary permissions <sup>1</sup>
6. Go back to `about:debugging` and click on "_Reload_" <sup>2</sup>
7. You may sign in and start using Pass

> <sup>1</sup> <small>Firefox does not prompt for permissions when launching a temporary add-on </small><br /><sup>2</sup> <small>FF might not pick-up the permission changes needed for content-script communication</small>

---

## Generate reviewable build & sources

> ⚠️ this does not apply to reviewers

In order to generate the sources and the build for a Firefox addon release run the generation script :

```shell
yarn run generate:ff-release [out-dir] [branch-name]? [commit]?
```

Specifify an `out-dir` located outside of the current git repository to avoid any conflicts. You may optionally specify a target branch and commit. If you don't it will fallback to the `pass-extension` branch.

Most of the time this will suffice <sup>3</sup> :

```shell
yarn run generate:ff-release "../../.."
```

> <sup>3</sup> <small>Make sure your local changes are pushed on the remote as we will be cloning the repository in the output directory</small>

This will create these files & folders :

-   `ProtonPass-{version}-{commit}-FF.zip` : firefox add-on build **for review**
-   `ProtonPass-{version}-{commit}-FF-sources.zip` : firefox add-on source files **for review**

Make sure the checksums match before submitting for review the two `.zip` files. The script will tell you otherwise. Common reasons why checksums don't match :

-   local changes have not been pushed - commit & push your changes
-   local repository has outdated dependencies - run `yarn`
