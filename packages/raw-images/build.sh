#!/bin/bash
mkdir -p dist && emcc dcraw.c -lm -DNODEPS \
    -s WASM=1 \
    -s ENVIRONMENT='web,worker' \
    -s INVOKE_RUN=0 \
    -s EXPORTED_RUNTIME_METHODS='["callMain", "FS"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=67108864 \
    -s MAXIMUM_MEMORY=536870912 \
    -s STACK_SIZE=5242880 \
    -o dist/dcraw.js