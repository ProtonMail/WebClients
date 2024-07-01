#!/usr/bin/env bash
set -eo pipefail

if [ ! -d "/tmp/sourcemapper" ]; then
    echo "Cloning sourcemapper"
    git clone \
      --quiet \
      --single-branch \
      --depth 1 \
      https://github.com/dhoko/sourcemapper.git "/tmp/sourcemapper";
else
    echo "sourcemapper initialised"
fi;
