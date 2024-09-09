# Drive compatibility layer

This allows other applications to use the Drive store, while we work on implementing a real core library.

-   Copied store lives in `./store`
    -   We also copy `./hooks`, `./components` and `./utils`
-   Patches for the store live in `./patches` as diffs
-   Extra functionality lives in `./lib`

To update drive-store with latest changes from applications/drive:

1. Run `yarn sync`

To copy over one particular file from Drive, run `yarn copy absolute_path_to_drive_file`.

If you'd like to modify the contents of a file after copying it from drive, run `yarn sync`, then makes the changes directly to the drive-store file.

Then run `git diff absolute_path_to_file > patches/0000x-patch.diff`