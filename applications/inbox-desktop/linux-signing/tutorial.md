# RPM signing

RPM packages are signed with a GPG signing subkey. The primary key certifies the subkey and stays offline. `RPM-GPG-KEY-proton-mail` contains the public key and its subkeys.

## Verify a package

Import the public key, then verify the RPM:

```bash
sudo rpm --import ./RPM-GPG-KEY-proton-mail
rpm -Kv ./proton-mail-*.rpm
```

The output should report that the signature and digests are OK.

## Manage signing keys

Run `rpm-signing-key.sh` with `GNUPGHOME` pointing to a dedicated offline keyring. Keep secret exports and revocation certificates private and backed up.

```bash
./rpm-signing-key.sh create "Name <email>"
./rpm-signing-key.sh list
./rpm-signing-key.sh add-subkey
./rpm-signing-key.sh revoke-subkey <subkey-fingerprint> superseded
./rpm-signing-key.sh export
```

Use `compromised` instead of `superseded` if a signing subkey leaks. Compromise revocation invalidates its existing package signatures once users update their imported key.

After rotation, update the CI signing material and the public key together. Users must re-import the updated public key; older RPM versions may require removing the previous copy first.

Replacing the primary key changes the public fingerprint. Publish its replacement and the old key’s revocation, and tell users to update their trusted keys. Keep old and new key material in separate directories.
