# Codeshift

This package uses [jscodeshift](https://github.com/facebook/jscodeshift) to transform code. It can help with large refactors.

## Example

Check for example [move-coupons](./src/payments/move-coupons/transform.ts). This file changes the `COUPON_CODE` to `@proton/payments` package.

## How to create a new codemod

1. Create a new folder in the src directory. Put transform.ts and files.txt in it. In my case, I compiled the list of files manually by running `yarn check-types` in affected pacakges and then pasting to files.txt and editing the result.

2. Add new script to package.json, see `move:coupons` an example. See `yarn jscodeshift --help` for available options. In particular, you might find `--dry` and `--print` helpful during development of the command.

3. Run the command, e.g. `yarn move:coupons`. See if it's applied correctly, repeat until done.
