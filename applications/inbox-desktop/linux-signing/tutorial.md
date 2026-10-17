# RPM signing

Fedora 45+ refuses to install an rpm unless it's signed with a key the user has imported. This is how we sign ours.

## How it works

- **Key:** primary key (vault only) certifies a signing subkey (CI only). `RPM-GPG-KEY-proton-mail` is the public half of both; users import it once.
- **CI:** `sign-linux` job (`sign-rpm.yml`) signs, verifies, and uploads to Nexus; fails in `ida-*` tag pipelines without the key.

| File                                                              | Where it lives                            |
| ----------------------------------------------------------------- | ----------------------------------------- |
| `primary-secret-backup.asc`, `primary-revocation.rev`, passphrase | Vault only                                |
| `ci-signing-subkey.b64`                                           | CI variable `INBOX_LINUX_GPG_PRIVATE_KEY` |
| passphrase, base64                                                | CI variable `INBOX_LINUX_GPG_PASSPHRASE`  |
| `RPM-GPG-KEY-proton-mail`                                         | This repo, plus hosted for users          |

CI variables are **protected + masked**, and the `ida-*` tags must be protected, or CI won't see the variables.

The CI subkey has the same passphrase as the primary key; gpg can't change it on a subkey-only export.

## Public key distribution

1. **Per build:** `sign-linux` uploads the key next to the rpm it signed, at `:bridge:/inda/<BUILD_ID>/linux/RPM-GPG-KEY-proton-mail`.
2. **Latest key:** after a successful signing, `sign-linux` also overwrites `:bridge:/inda/linux/RPM-GPG-KEY-proton-mail`. Only builds that actually signed (protected `ida-*` tags) write it, so a branch can't swap the key.
3. **Public:** every publish job uploads the latest key (from step 2) to `https://proton.me/download/mail/linux/RPM-GPG-KEY-proton-mail`. The URL never changes.

A signed build from an old branch made before a rotation puts the old key back in step 2. The next normal build fixes it.

## First-time setup

```bash
export GNUPGHOME=$(mktemp -d)
./rpm-signing-key.sh create "Proton AG (Proton Mail Desktop) <EMAIL>"
```

1. Store `primary-secret-backup.asc`, `primary-revocation.rev` and the passphrase in the vault.
2. Set the CI variables:
    - `INBOX_LINUX_GPG_PRIVATE_KEY`: the contents of `ci-signing-subkey.b64`
    - `INBOX_LINUX_GPG_PASSPHRASE`: the output of `printf '%s' '<passphrase>' | base64`
3. Commit `RPM-GPG-KEY-proton-mail`; the pipeline publishes it.
4. Clean up: `rm -rf "$GNUPGHOME" ci-signing-subkey.b64 primary-*`.

## Opening the offline keyring

Adding or revoking a subkey needs the primary key:

```bash
export GNUPGHOME=$(mktemp -d)
gpg --import primary-secret-backup.asc
./rpm-signing-key.sh list
```

Once you're done, update the vault backup (`gpg --armor --export-secret-keys > primary-secret-backup.asc`) and clean up as in the first-time setup.

## Rotating the subkey

```bash
./rpm-signing-key.sh add-subkey
./rpm-signing-key.sh revoke-subkey <old subkey fingerprint> superseded
```

1. Update `INBOX_LINUX_GPG_PRIVATE_KEY` with the new `ci-signing-subkey.b64`.
2. Commit the new `RPM-GPG-KEY-proton-mail`; the pipeline publishes it. Fingerprint and URL stay the same.
3. Tell users to re-import the key; see [Users](#users).

`superseded` keeps old packages verifying. If leaked: revoke with `compromised` and release immediately; old packages then stop verifying.

## Primary key leaked or lost

- **Leaked:** start over.
    1. Run `create` in a new, empty `GNUPGHOME`; the fingerprint changes.
    2. In the old keyring, revoke the old key: remove the leading `:` from `-----BEGIN` in `primary-revocation.rev`, then `gpg --import primary-revocation.rev`.
    3. Still in the old keyring, append the revoked old key to the new file: `gpg --armor --export <old fingerprint> >> RPM-GPG-KEY-proton-mail`.
    4. Update the docs fingerprint and tell users to swap keys.
- **Lost but not leaked:** the current subkey keeps signing, but you can't add or revoke subkeys anymore. Plan a new key.

## Users

```bash
sudo rpm --import https://proton.me/download/mail/linux/RPM-GPG-KEY-proton-mail
sudo dnf install ./proton-mail-*.rpm
```

After a key change, users with **rpm 6** (Fedora 45+) re-run the `rpm --import`. Users with **older rpm** have to remove the old key first:

```bash
rpm -q gpg-pubkey --qf '%{NAME}-%{VERSION}-%{RELEASE}\t%{SUMMARY}\n'
sudo rpm -e gpg-pubkey-<version>-<release>
```

## Troubleshooting

- **`RPM signing key missing in a tag pipeline`:** see protection note above.
- **`rpmkeys --checksig` fails in CI:** the CI subkey doesn't belong to the committed public key. Usually the public key wasn't updated after a rotation.
- **Check a package by hand:** `rpm -Kv proton-mail-*.rpm`.
