#!/bin/bash

if [ -z "$BUILD_NUMBER" ]; then
  echo "BUILD_NUMBER is not provided. Automatically bumping."
  fastlane automatically_bump_build_number
else
  echo "BUILD_NUMBER is provided: $BUILD_NUMBER"
  fastlane bump_build_number build_number:"$BUILD_NUMBER"
fi