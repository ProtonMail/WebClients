#!/usr/bin/env sh
set -eu

CI_REGISTRY_IMAGE="${CI_REGISTRY_IMAGE:-local/protonmail}"
CI_COMMIT_SHORT_SHA="${CI_COMMIT_SHORT_SHA:-$(git rev-parse --short HEAD)}"
CI_COMMIT_REF_SLUG="${CI_COMMIT_REF_SLUG:-$(git rev-parse --abbrev-ref HEAD | sed -e 's/[^[:alnum:]]/-/g')}"
COMMIT_TAG="commit-$CI_COMMIT_SHORT_SHA"
BRANCH_TAG="branch-$CI_COMMIT_REF_SLUG"
GIT_HEAD_DESC="$(git describe --long --dirty --all)"

[ "${CI_JOB_TOKEN:-}" ] && docker login -u gitlab-ci-token -p "$CI_JOB_TOKEN" "$CI_REGISTRY"

if [ "${GCR_CREDENTIALS_JSON:-}" ]; then
    echo '=> logging in to gcr.io'
    echo "${GCR_CREDENTIALS_JSON}" | docker login -u _json_key --password-stdin gcr.io
fi

if [ ! "${CI:-}" ]; then
    COMMIT_TAG='local'
fi

clock() {
    local start=$(date +%s)
    $@
    local exit_code=$?
    echo >&2 "~> ~$(($(date +%s)-${start}))s"
    return $exit_code
}

size() {
    echo >&2 "~> $(($(docker image inspect "$1" --format='{{.Size}}') / 1024 / 1024)) MB"
}

drun_node() {
    # Enables interactive TTY if available
    local TTY_OPT="-i"
    [ -t 0 ] && TTY_OPT="-it"
    local repo_root="$(git rev-parse --show-toplevel)"
    docker run --rm $TTY_OPT \
        -v "${repo_root}:${repo_root}" -w "${repo_root}" \
        node:lts $@
}

echo '=> Assuming repo is configured according to ./README.md#Config'
echo "=> Bundling app..."
subprojects_opts=''
if [ ! -r '../proton-mail-settings/package.json' ]; then
    echo '~> not bundling settings since no source found at ../proton-mail-settings'
    subprojects_opts="${subprojects_opts} --no-settings"
fi
if [ ! -r '../proton-contacts/package.json' ]; then
    echo '~> not bundling contacts since no source found at ../proton-contacts'
    subprojects_opts="${subprojects_opts} --no-contacts"
fi
if [ "${NO_BUNDLE:-}" ]; then
    echo '~> skipped.'
elif (command -v node > /dev/null); then
    clock npm run bundle -- --api=proxy ${subprojects_opts:-}
else
    clock drun_node npm run bundle -- --api=proxy ${subprojects_opts:-}
fi

image_name="${CI_REGISTRY_IMAGE}/dist"
echo "=> Building ${image_name}:${COMMIT_TAG} and ${image_name}:${BRANCH_TAG}..."
clock docker build . -f ./docker/Dockerfile.dist \
    --cache-from "${image_name}:${BRANCH_TAG}" \
    --cache-from "${image_name}:branch-master" \
    -t "${image_name}:${COMMIT_TAG}" \
    -t "${image_name}:${BRANCH_TAG}"
size "${image_name}:${BRANCH_TAG}"

if [ "${CI:-}" ]; then
    echo "=> Pushing images..."
    clock docker push "${image_name}:${COMMIT_TAG}"
    clock docker push "${image_name}:${BRANCH_TAG}"
fi

if [ "${EXTRA_REGISTRY_IMAGE:-}" ]; then
    extra_image_name="${EXTRA_REGISTRY_IMAGE}/dist"

    docker tag "${image_name}:${COMMIT_TAG}" "${extra_image_name}:${COMMIT_TAG}"
    docker tag "${image_name}:${BRANCH_TAG}" "${extra_image_name}:${BRANCH_TAG}"
    clock docker push "${extra_image_name}:${COMMIT_TAG}"
    clock docker push "${extra_image_name}:${COMMIT_TAG}"
fi
