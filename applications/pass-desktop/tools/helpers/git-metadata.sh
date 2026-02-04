#!/usr/bin/env sh
# Shared helper functions for metadata repository operations

# Validate required environment variables
validate_env() {
    if [ -z "${PASS_DESKTOP_METADATA_REPO:-}" ]; then
        echo "Error: PASS_DESKTOP_METADATA_REPO is not set." >&2
        exit 1
    fi

    if [ -z "${GITLAB_USER_NAME:-}" ]; then
        echo "Error: GITLAB_USER_NAME is not set." >&2
        exit 1
    fi

    if [ -z "${GITLAB_USER_EMAIL:-}" ]; then
        echo "Error: GITLAB_USER_EMAIL is not set." >&2
        exit 1
    fi
}

# Clone and setup metadata repository
# Usage: setup_metadata_repo
# Returns: Path to cloned repo in METADATA_REPO variable
setup_metadata_repo() {
    validate_env

    METADATA_REPO=$(mktemp -d)

    git clone --depth 1 "${PASS_DESKTOP_METADATA_REPO}" "$METADATA_REPO"

    cd "$METADATA_REPO"
    git config --local user.name "${GITLAB_USER_NAME}"
    git config --local user.email "${GITLAB_USER_EMAIL}"

    echo "$METADATA_REPO"
}

# Create branch, commit changes, and push with MR
# Usage: commit_and_push_mr <branch_name> <commit_message>
commit_and_push_mr() {
    local branch_name="$1"
    local commit_message="$2"

    if [ -z "$branch_name" ] || [ -z "$commit_message" ]; then
        echo "Error: branch_name and commit_message are required" >&2
        exit 1
    fi

    echo "Creating branch: $branch_name"
    git checkout -b "$branch_name"

    echo "Adding changes..."
    git add .

    echo "Git status:"
    git status

    echo "Committing: $commit_message"
    git commit -m "$commit_message"

    echo "Pushing and creating merge request..."
    git push -u origin "$branch_name" \
        -o merge_request.create \
        -o merge_request.target=main \
        -o merge_request.remove_source_branch
}

# Cleanup metadata repo
# Usage: cleanup_metadata_repo
cleanup_metadata_repo() {
    if [ -n "${METADATA_REPO:-}" ] && [ -d "$METADATA_REPO" ]; then
        echo "Cleaning up: $METADATA_REPO"
        rm -rf "$METADATA_REPO"
    fi
}
