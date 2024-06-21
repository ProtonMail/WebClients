#!/bin/bash

if [ "$BUILD_ENV" == "Black" ]; then
    echo "Building for black"
    yarn build:dev 
else
    echo "Building for prod"
    yarn build
fi