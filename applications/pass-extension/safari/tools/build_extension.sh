#!/bin/bash

if [ "$BUILD_ENV" == "Black" ]; then
    echo "Building for black"
    BUILD_TARGET=safari yarn build:extension:dev
else
    echo "Building for prod"
    BUILD_TARGET=safari RELEASE=true yarn build:extension
fi
