# Search

## Cryptography

Search index data is encrypted at rest in IndexedDB. Two layers of cryptography are involved:

### Symmetric encryption (AES-GCM) — `shared/SearchCrypto.ts`

All index blobs are encrypted with a per-user AES-GCM key using the Web Crypto `subtle` API.

- **Key lifecycle** — `SearchIndexKeyManager` generates a 256-bit AES-GCM key on first use, persists it OpenPGP-wrapped in IndexedDB, and unwraps it on subsequent loads. If decryption fails (e.g. OpenPGP key deletion), the key is regenerated and the stale index is cleared.
- **Blob encryption** — each blob is encrypted with AES-GCM. The additional authenticated data (AAD) encodes the index kind and blob name (`drive.search.blob.{indexKind}.{blobName}`), binding each ciphertext to its identity so blobs cannot be swapped or replayed across indexes.
- **Key serialization** — the raw key bytes are base64-encoded before OpenPGP wrapping, since the `CryptoProxyBridge` interface is string-only (Comlink serialization boundary).

### OpenPGP key wrapping — `mainThread/CryptoProxyBridge.ts`

The AES-GCM key is encrypted and signed with the user's primary account OpenPGP key before storage and unwrapped on load. This runs on the **main thread** because `CryptoProxy` is not available inside the SharedWorker. The `CryptoProxyBridge` class is exposed to the worker via Comlink proxy.

### Key generation (first use)

1. Check IndexedDB for an existing OpenPGP-wrapped key
2. No key found — generate a 256-bit AES-GCM key, OpenPGP-wrap it, and store the wrapped key in IndexedDB. Any existing index data is cleared (new key = old blobs are undecryptable).

### Key loading (subsequent uses)

1. Read the OpenPGP-wrapped key from IndexedDB and unwrap it
2. If decryption fails (e.g. OpenPGP key no longer in keyring), fall back to key generation

### Blob encryption

- **Save**: serialize blob to CBOR, encrypt with AES-GCM, store ciphertext in IndexedDB
- **Load**: read ciphertext from IndexedDB, decrypt and verify, deserialize from CBOR

Each blob is encrypted with AAD encoding the index kind and blob name (`drive.search.blob.{indexKind}.{blobName}`), preventing blobs from being swapped across indexes.

### Design note: no HKDF key derivation

Drive search uses the generated AES-GCM key directly rather than deriving a sub-key via HKDF. Key derivation is unnecessary here because the key is single-purpose (only used for search blob encryption) and is already wrapped with OpenPGP, which provides its own key isolation per user.
