/*
  lumo-prod-2.pub.gpg: OpenPGP Certificate.

      Fingerprint: F032A1169DDFF8EDA728E59A9A74C3EF61514A2A
  Public-key algo: EdDSA
  Public-key size: 256 bits
    Creation time: 2025-04-28 11:22:21 UTC
  Expiration time: 2029-04-27 11:22:21 UTC (creation time + 3years 11months 29days 9h 50m 24s)
        Key flags: certification, signing

           Subkey: DA656791F790D0A297C79CCEE7DF128A8FC5DE04
  Public-key algo: ECDH
  Public-key size: 256 bits
    Creation time: 2025-04-28 11:22:21 UTC
  Expiration time: 2029-04-27 11:22:21 UTC (creation time + 3years 11months 29days 9h 50m 24s)
        Key flags: transport encryption, data-at-rest encryption

           UserID: Proton Lumo (Prod Key 0002) <support@proton.me>
 */

export const LUMO_GPG_PUB_KEY_PROD_2 = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEaA9k7RYJKwYBBAHaRw8BAQdABaPA24xROahXs66iuekwPmdOpJbPE1a8A69r
siWP8rfNL1Byb3RvbiBMdW1vIChQcm9kIEtleSAwMDAyKSA8c3VwcG9ydEBwcm90
b24ubWU+wpkEExYKAEEWIQTwMqEWnd/47aco5ZqadMPvYVFKKgUCaA9k7QIbAwUJ
B4TOAAULCQgHAgIiAgYVCgkICwIEFgIDAQIeBwIXgAAKCRCadMPvYVFKKqiVAQD7
JNeudEXTaNMoQMkYjcutNwNAalwbLr5qe6N5rPogDQD/bA5KBWmDlvxVz7If6SBS
7Xzcvk8VMHYkBLKfh+bfUQzOOARoD2TtEgorBgEEAZdVAQUBAQdAnBIJoFt6Pxnp
RAJMHwhdCXaE+lwQFbKgwb6LCUFWvHYDAQgHwn4EGBYKACYWIQTwMqEWnd/47aco
5ZqadMPvYVFKKgUCaA9k7QIbDAUJB4TOAAAKCRCadMPvYVFKKkuRAQChUthLyAcc
UD6UrJkroc6exHIMSR5Vlk4d4L8OeFUWWAEA3ugyE/b/pSQ4WO+fiTkHN2ZeKlyj
dZMbxO6yWPA5uQk=
=h/mc
-----END PGP PUBLIC KEY BLOCK-----`;

// Webpack DefinePlugin will replace this at build time if LUMO_PUB_KEY_PATH is set
declare const LUMO_CUSTOM_PUB_KEY: string | undefined;

/**
 * Lumo public key - defaults to production key, but can be overridden at build time
 *
 * To use a custom key (e.g., for local dev backend):
 * 1. Save your dev public key to a file: ~/.proton/lumo-dev.pub
 * 2. Set environment variable: export LUMO_PUB_KEY_PATH=~/.proton/lumo-dev.pub
 * 3. Start the app: yarn workspace proton-lumo start
 *
 * The custom key is loaded by webpack at build time and injected as a compile-time constant.
 * No key material needs to be committed to the repository.
 */
export const LUMO_GPG_PUB_KEY =
    typeof LUMO_CUSTOM_PUB_KEY !== 'undefined' ? LUMO_CUSTOM_PUB_KEY : LUMO_GPG_PUB_KEY_PROD_2;
