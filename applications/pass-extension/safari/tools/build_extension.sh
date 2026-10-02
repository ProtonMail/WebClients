#!/bin/bash

if [ "$BUILD_ENV" == "Black" ]; then
    echo "Building for black"
    BUILD_TARGET=safari pnpm run build:extension:dev
else
    echo "Building for prod"
    BUILD_TARGET=safari RELEASE=true pnpm run build:extension
fi
