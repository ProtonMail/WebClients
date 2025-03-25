#!/bin/bash
mkdir -p dist && emcc cr3.c \
    -s WASM=1 \
    -s ENVIRONMENT='web,worker' \
    -s INVOKE_RUN=0 \
    -s EXPORTED_RUNTIME_METHODS='["FS", "ccall"]' \
    -s EXPORTED_FUNCTIONS='["_extract_cr3_images"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=67108864 \
    -s MAXIMUM_MEMORY=536870912 \
    -s STACK_SIZE=5242880 \
    -o dist/cr3.js


# Debug Build
if [[ "$1" == "--debug" ]]; then
  mkdir -p dist && emcc cr3.c \
    -s WASM=1 \
    -s ENVIRONMENT='web,worker' \
    -s INVOKE_RUN=0 \
    -s EXPORTED_RUNTIME_METHODS='["FS", "ccall"]' \
    -s EXPORTED_FUNCTIONS='["_extract_cr3_images"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=67108864 \
    -s MAXIMUM_MEMORY=536870912 \
    -s STACK_SIZE=5242880 \
    -DDEBUG=1 \
    -o dist/cr3-debug.js
fi