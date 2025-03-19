### Info

`dcraw.c` is copied from https://github.com/ncruces/dcraw/tree/ncruces-dev latest updates and we manually remove the restricted (Faveon) functions to be licence compliant.

We build it with `build.sh` specifically targeted for browser usage

### TODO

- E2E tests of the Thumbnail generation
- If dcraw.c (very light) does not support the format, fallback to https://www.npmjs.com/package/libraw-wasm (very heavy) to decode the raw file and extract a thumbnail

### Resources

Good website to find test images: https://sembiance.com/fileFormatSamples/image/
