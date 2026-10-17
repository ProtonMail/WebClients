#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat >&2 <<EOF
Usage: GNUPGHOME=<offline keyring dir> $(basename "$0") <command>

Commands:
  create "<user id>"              Create the certify-only primary key and a first signing subkey
  add-subkey                      Add a new signing subkey
  revoke-subkey <fpr> <reason>    Revoke a subkey; reason: compromised | superseded | retired
  list                            Show the primary key and its subkeys
  export                          Write the public key and the CI export of the newest signing subkey

Output files are written to \$OUTPUT_DIR (default: current directory).
EOF
    exit 1
}

primary_fingerprint() {
    gpg --list-secret-keys --with-colons | awk -F: '/^fpr/{print $10; exit}'
}

newest_signing_subkey() {
    gpg --list-keys --with-colons "$(primary_fingerprint)" | awk -F: '
        $1 == "sub" { usable = ($2 != "r" && $2 != "e" && $12 ~ /s/); created = $6; next }
        $1 == "fpr" && usable { print created, $10; usable = 0 }
    ' | sort -n | tail -1 | cut -d" " -f2
}

create() {
    if [ -n "$(primary_fingerprint)" ]; then
        echo "The keyring in $GNUPGHOME already has a key" >&2
        exit 1
    fi
    gpg --quick-generate-key "$1" rsa4096 cert never
    local primary
    primary="$(primary_fingerprint)"
    gpg --quick-add-key "$primary" rsa4096 sign never
    gpg --armor --export-secret-keys "$primary" >"$output_dir/primary-secret-backup.asc"
    cp "$GNUPGHOME/openpgp-revocs.d/$primary.rev" "$output_dir/primary-revocation.rev"
    export_keys
}

add_subkey() {
    gpg --quick-add-key "$(primary_fingerprint)" rsa4096 sign never
    export_keys
}

revoke_subkey() {
    local reason_code
    case "$2" in
        compromised) reason_code=1 ;;
        superseded) reason_code=2 ;;
        retired) reason_code=3 ;;
        *) usage ;;
    esac
    printf 'key %s\nrevkey\ny\n%s\n\ny\nsave\n' "$1" "$reason_code" |
        gpg --command-fd 0 --edit-key "$(primary_fingerprint)"
    gpg --armor --export "$(primary_fingerprint)" >"$output_dir/RPM-GPG-KEY-proton-mail"
}

export_keys() {
    local subkey
    subkey="$(newest_signing_subkey)"
    gpg --armor --export "$(primary_fingerprint)" >"$output_dir/RPM-GPG-KEY-proton-mail"
    gpg --armor --export-secret-subkeys "$subkey!" | base64 | tr -d '\n' >"$output_dir/ci-signing-subkey.b64"
    echo "Signing subkey: $subkey" >&2
}

[ -n "${GNUPGHOME:-}" ] || { echo "Set GNUPGHOME to the offline signing keyring" >&2; exit 1; }
output_dir="${OUTPUT_DIR:-$PWD}"

case "${1:-}" in
    create) [ $# -eq 2 ] || usage; create "$2" ;;
    add-subkey) add_subkey ;;
    revoke-subkey) [ $# -eq 3 ] || usage; revoke_subkey "$2" "$3" ;;
    list) gpg --list-keys --with-subkey-fingerprints "$(primary_fingerprint)" ;;
    export) export_keys ;;
    *) usage ;;
esac
