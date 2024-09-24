# Proton Pass 🔥🦊

## Firefox Extension Reviewers

Below are the requirements and build steps for our ProtonPass extension release. Please replace `{version}` and `{commit}` with the appropriate values when following the steps.

### Requirements

Before building the extension, please ensure that you have the following versions installed:

-   node v20.5
-   npm v9.8.0
-   yarn v4.0.0

### File info

-   `ProtonPass-{version}-{commit}-FF.zip` : firefox add-on release
-   `ProtonPass-{version}-{commit}-FF-sources.zip` : firefox add-on source files

### Build Steps

To build the Firefox version of the ProtonPass extension, please follow these steps:

1.  Unzip `ProtonPass-{version}-{commit}-FF-sources.zip`
2.  Navigate to the unzipped folder in your terminal: `cd ProtonPass-{version}-{commit}-FF`
3.  Install dependencies: `yarn`
4.  Navigate to the extension folder: `cd applications/pass-extension`
5.  Build the Firefox addon: `yarn run build:extension:ff` (this may take several minutes to complete)
6.  Build files are located at `applications/pass-extension/dist`
