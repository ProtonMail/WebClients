#!/usr/bin/env bash
SUCCESS='\033[0;32m\033[1m'
ERROR='\033[0;31m\033[1m'
WARNING='\033[0;33m\033[1m'
INFO='\033[0;34m\033[1m'
NOCOLOR='\033[0m'

# FIREFOX RELEASE GENERATOR
# This shell script is responsible for building the
# Pass firefox add-on and creating the necessary source
# files required for the AMO reviewers to re-build the
# extension. It will create the release and do a checksum
# integrity check by comparing a temporary build created
# from the reviewable sources to the released build.
# https://extensionworkshop.com/documentation/publish/source-code-submission/

USAGE="usage $0 [out-dir] [branch-name]? [commit-hash]?"
OUT="$1"
BRANCH="$2"
COMMIT="$3"

ORIGIN=$(git remote get-url origin)
REPO_DIR=$(realpath "../..")
SOURCE_DIR=$(realpath .)

# fallback to current commit if none specified
# fallback to main branch if none specified
if [ -z "$OUT" ]; then
    echo -e "${WARNING}No output directory specified: using \"../../..\"${NOCOLOR}"
    echo -e "${WARNING}${USAGE}${NOCOLOR}"
    OUT="../../.."
fi

OUT_DIR=$(realpath $OUT)

# check $OUT_DIR validity
if [[ "$OUT_DIR" == "$REPO_DIR"* ]]; then
    echo -e "${ERROR}the output directory should be outside of the current repository${NOCOLOR}"
    echo -e "${WARNING}${USAGE}${NOCOLOR}"
    exit 0
fi

# fallback to main branch if none specified
if [ -z "$BRANCH" ]; then
    BRANCH="main"
fi

# fallback to current commit if none specified
if [ -z "$COMMIT" ]; then
    COMMIT=$(git rev-parse --short HEAD)
fi

VERSION=$(cat ./manifest-firefox.json | jq -r .version)
BUILD_ID="ProtonPass-${VERSION}-${COMMIT}-FF"

EXCLUDE=(
    .git
    .github
    .gitlab
    .gitlab-ci.yml
    .husky
    .publishignore
    ACTIONS.md
    ci
    utilities
    tests
    # applications/account
    # applications/admin
    # applications/calendar
    # applications/drive
    # applications/mail
    # applications/storybook
    # applications/verify
    # applications/vpn-settings
    packages/config
    sonar-project.properties
)

# delete target directory if already exists
if [ -d "$TARGET_DIR" ]; then
    rm -Rf "$TARGET_DIR"
fi

rm -rf $OUT/$BUILD_ID || true
mkdir -p $OUT/$BUILD_ID
TARGET_DIR=$(realpath "$OUT/$BUILD_ID")

# Build and zip release for FF
echo -e "${INFO}📄 Generating release for ${BUILD_ID}${NOCOLOR}"
NODE_ENV=production BUILD_TARGET=firefox yarn run build >/dev/null
echo -e "${SUCCESS} ↳ Built production release [BUILD_TARGET=firefox]${NOCOLOR}"
(cd dist && zip -vr $OUT_DIR/$BUILD_ID.zip * -x "*.DS_Store" >/dev/null)
echo -e "${SUCCESS} ↳ Compressed release : \"$OUT_DIR/$BUILD_ID.zip\"${NOCOLOR}"

# Clone monorepo
# Git clone depth is set to CLONE_DEPTH=50 to
# speed up download. If the commit hash for the
# release is older : increase the value
echo -e "${INFO}🧬 Cloning monorepo on branch $BRANCH...${NOCOLOR}"
cd $TARGET_DIR

git clone -b $BRANCH --single-branch $REPO_DIR $TARGET_DIR --quiet || exit 1
echo -e "${SUCCESS} ↳ Cloned to \"${TARGET_DIR}\"${NOCOLOR}"

# Checkout the to commit hash
git checkout ${COMMIT} --quiet || exit 1
echo -e "${SUCCESS} ↳ Checked out to \"${COMMIT}\"${NOCOLOR}"

# install node_modules
yarn install >/dev/null
echo -e "${SUCCESS} ↳ Installed dependencies${NOCOLOR}"

# Filter out repo for firefox reviewers
# create a minimal working monorepo with
# only the files required to build Pass
echo -e "${INFO}🧹 Filtering repo for reviewers...${NOCOLOR}"
for ignore in "${EXCLUDE[@]}"; do
    if [ -d "${ignore}/" ]; then
        rm -rf "$ignore" || true
    else
        rm -f "$ignore" || true
    fi
    echo -e "${SUCCESS} ↳ Removed \"${ignore}\"${NOCOLOR}"
done

echo -e "${INFO}🔍 Verifying build $BUILD_ID integrity...${NOCOLOR}"

# Re-build firefox release from source :
# copy the config used for building the production
# release to the firefox release sources.
cd "applications/pass-extension"
cp $SOURCE_DIR/src/app/config.ts ./src/app/config.ff-release.ts
echo -e "${SUCCESS} ↳ Created config.ff-release.ts${NOCOLOR}"
yarn run build:ff >/dev/null
echo -e "${SUCCESS} ↳ $BUILD_ID successfuly built from reviewable sources${NOCOLOR}"

CHECKSUM_SOURCE=$(find -s "$SOURCE_DIR/dist" -type f ! -name ".DS_Store" -exec openssl md5 {} \; | awk '{ print $2 }' | openssl md5)
CHECKSUM_TARGET=$(find -s "./dist" -type f ! -name ".DS_Store" -exec openssl md5 {} \; | awk '{ print $2 }' | openssl md5)

echo -e "${INFO} ↳ checksum source : \"$CHECKSUM_SOURCE\"${NOCOLOR}"
echo -e "${INFO} ↳ checksum target : \"$CHECKSUM_TARGET\"${NOCOLOR}"

if [ "$CHECKSUM_SOURCE" == "$CHECKSUM_TARGET" ]; then
    echo -e "${SUCCESS}✅ Checksums matched${NOCOLOR}"

    # zip final source files
    cd $TARGET_DIR
    rm -rf $(find . -type d -name node_modules) || true # remove all node_modules
    rm -rf /applications/pass-extension/dist || true    # remove dist
    cp applications/pass-extension/FIREFOX.md README.md || true
    zip -r $OUT_DIR/$BUILD_ID-sources.zip . \
        -x "*.DS_Store" \
        -x .yarn/cache/* \
        -x .yarn/install-state.gz \
        -x .yarn/sdks/* \
        -x .yarn/versions/* \
        >/dev/null
    cd ../ && rm -rf $TARGET_DIR # clean-up

    echo -e "${SUCCESS} ↳ ready to submit for review :${NOCOLOR}"
    echo -e "${SUCCESS} ↳ $OUT_DIR/$BUILD_ID.zip${NOCOLOR}"
    echo -e "${SUCCESS} ↳ $OUT_DIR/$BUILD_ID-sources.zip${NOCOLOR}"
else
    echo -e "${ERROR}⛔️ Checksums do not match${NOCOLOR}"
    echo -e "${ERROR} ↳ fix conflicts before submitting for review${NOCOLOR}"
fi
