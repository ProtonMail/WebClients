fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### load_asc_api_key

```sh
[bundle exec] fastlane load_asc_api_key
```

Load App Store Connect API Key information to use in subsequent lanes

### bump_version_number

```sh
[bundle exec] fastlane bump_version_number
```

Bump version number, optionally ask for input if version number not provided as argument

### bump_build_number

```sh
[bundle exec] fastlane bump_build_number
```

Bump build number, optionally ask for input if build number not provided as argument

### automatically_bump_build_number

```sh
[bundle exec] fastlane automatically_bump_build_number
```

Get latest TestFlight build number and bump build number by one

### build_and_upload

```sh
[bundle exec] fastlane build_and_upload
```

Build and upload to App Store Connect then post a message to Slack

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
