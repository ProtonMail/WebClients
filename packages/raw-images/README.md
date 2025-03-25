## Info

### DCRAW

`dcraw.c` is copied from https://github.com/ncruces/dcraw/tree/ncruces-dev latest updates and we manually remove the restricted (Faveon) functions to be licence compliant.

We build it with `build-dcraw.sh` specifically targeted for browser usage

### CR3

`cr3.c` is heavily inspired and based on https://github.com/lclevy/canon_cr3 code and information

We build it with `./build-cr3.sh` but I also added the `-DDEBUG=1` flag so you can have tons of debug info (`./build.sh --debug`)

### TODO

- E2E tests of the Thumbnail generation

### Resources

Good website to find test images: https://sembiance.com/fileFormatSamples/image/
