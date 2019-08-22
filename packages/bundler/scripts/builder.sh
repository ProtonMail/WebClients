#!/usr/bin/env bash
set -eo pipefail

cd "/tmp/$1";
npm run deploy -- ${*:2} --source=remote;
