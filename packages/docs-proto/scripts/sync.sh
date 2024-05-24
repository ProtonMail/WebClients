#!/bin/bash

DEST_DIR=$1

TMP_DIR=$(mktemp -d)

git clone git@gitlab.protontech.ch:drive/docs/protobuf-definitions.git $TMP_DIR

cp -r ${TMP_DIR}/lib ${DEST_DIR}

rm -rf ${TMP_DIR}
