## Releasing a new version of Proton Pass

-   [ ] Ensure all issues and pull requests are resolved.
-   [ ] Update [the changelog] since last release and commit.
-   [ ] Increment the version in manifest-chrome.json and manifest-firefox.json

For Chrome, run

```bash
yarn run build:extension
```

then zip the dist/ folder and submit it to Chrome store.

For Firefox,

```bash
yarn run generate:ff-release "../../.."
```

This will create these files & folders on the parent folder of this repo:

-   `ProtonPass-{version}-{commit}-FF.zip` : firefox add-on build **for review**
-   `ProtonPass-{version}-{commit}-FF-sources.zip` : firefox add-on source files **for review**

Make sure the checksums match before submitting for review the two `.zip` files. The script will tell you otherwise. Common reasons why checksums don't match :

-   local changes have not been pushed - commit & push your changes
-   local repository has outdated dependencies - run `yarn`
