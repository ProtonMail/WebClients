The crypto package interfaces the apps with the underlying OpenPGP crypto libs of pmcrypto and OpenPGP.js, as well as the browser's native WebCrypto API.

> **`pmcrypto` no longer needs to be directly imported by the apps and other packages, you should always use `@proton/crypto` instead.**

## Usage

The utils functions that `pmcrypto` exported (e.g. `arrayToBinaryString`) are now accessible under `@proton/crypto/lib/utils`.

Crypto-related functions runnable in web workers are handled by the `CryptoProxy`, which is initialized together with the apps (see [this section](web-worker-integration) for more info on the setup).

### Examples

<details>
<summary><b>Importing/exporting public and private keys</b></summary>

#### Importing/exporting public and private keys

`OpenPGPKey` objects have been replaced by `PrivateKeyReference` and `PublicKeyReference` ones, as key material stored away from main thread.

To import keys:

```js
const recipientPublicKey = await CryptoProxy.importPublicKey({ armoredKey: '...' }); // or `binaryKey`
// To import a private key, the passphrase must be known
// (otherwise, either wait for it to be available, or import as public key)
const senderPrivateKey = await CryptoProxy.importPrivateKey({
    armoredKey: '...', // or `binaryKey`
    passphrase: 'key decryption passphrase', // If the key is expected to be already decrypted (rare, but it can happen for keys uploaded by the user), you have to pass `passphrase: null`.
});
```

To export keys to be able to transfer them:

```js
// on public key export, if a private key is given, only the public key material is extracted and serialized
const armoredPublicKey = await CryptoProxy.exportPublicKey({
    key: senderPrivateKey,
    format: 'armored', // or 'binary'
});
// on private key export, the key will be encrypted before serialization, using the given `passhrapse`
const armoredPrivateKey = await CryptoProxy.exportPrivateKey({
    key: senderPrivateKey,
    passphrase: 'key encryption passphrase',
    format: 'armored', // or 'binary'
});
```

To delete the keys from memory once they are no longer needed:

```js
// invalidate a specific key reference
await CryptoProxy.clearKey({ key: senderPrivateKey }); // after this, passing `senderPrivateKey` to the `CryptoProxy` will result in an error

// invalidate all keys previously imported and generated using the `CryptoProxy`
await CryptoProxy.clearKeyStore();
```

</details>

<details>
<summary><b>Encrypt/sign and decrypt/verify string or binary data using keys</b></summary>

#### Encrypt/sign and decrypt/verify string or binary data using keys

To encrypt and sign:

```js
// import the required keys
const senderPublicKey = await CryptoProxy.importPublicKey(...);
const recipientPrivateKey = await CryptoProxy.importPrivateKey(...);

const {
  message: armoredMessage,
  signature: armoredSignature,
  encryptedSignature: armoredEncryptedSignature,
} = await CryptoProxy.encryptMessage({
  textData: 'text data to encrypt', // or `binaryData` for Uint8Arrays
  encryptionKeys: recipientPublicKey, // and/or `passwords`
  signingKeys: senderPrivateKey,
  detached: true,
  format: 'armored' // or 'binary' to output a binary message and signature
});

// share `armoredMessage`
```

To decrypt and verify:

```js
// import the required keys
const senderPublicKey = await CryptoProxy.importPublicKey(...);
const recipientPrivateKey = await CryptoProxy.importPrivateKey(...);

const { data: decryptedData, verified, verificationErrors } = await CryptoProxy.decryptMessage({
  armoredMessage, // or `binaryMessage`
  armoredEncryptedSignature, // or 'binaryEncryptedSignature'/'armoredSignature'/'binarySignature'
  decryptionKeys: recipientPrivateKey // and/or 'passwords'/'sessionKey'
  verificationKeys: senderPublicKey
});

if (verified === VERIFICATION_STATUS.SIGNED_AND_VALID) {
  console.log(decryptedData)
} else if (verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
  console.log(verificationErrors)
}
```

</details>

<details>
<summary><b>Encrypt/decrypt using the session key</b></summary>

#### Encrypt/decrypt using the session key directly

```js
// First generate the session key
const sessionKey = await CryptoProxy.generateSessionKey({ recipientKeys: recipientPublicKey });

// Then encrypt the data with it
const { message: armoredMessage } = await CryptoProxy.encryptMessage({
    textData: 'text data to encrypt', // or `binaryData` for Uint8Arrays
    sessionKey,
    encryptionKeys: recipientPublicKey, // and/or `passwords`, used to encrypt the session key
    signingKeys: senderPrivateKey,
});
```

To decrypt, you can again provide the session key directly:

```js
// Then encrypt the data with it
const { data } = await CryptoProxy.decryptMessage({
    armoredMessage, // or `binaryMessage`
    sessionKeys: sessionKey,
    verificationKeys: senderPublicKey,
});
```

You can also encrypt the session key on its own:

```js
const armoredEncryptedSessionKey = await encryptSessionKey({
    ...sessionKey,
    encryptionKeys, // and/or passwords
    format: 'armored', // or 'binary'
});

// And decrypt it with:
const sessionKey = await CryptoProxy.decryptSessionKey({
    armoredMessage: armoredEncryptedSessionKey, // or `binaryMessage`
    decryptionsKeys, // or `passwords`
});
```

</details>

## Web Worker Integration

The CryptoProxy redirects crypto request to whatever endpoint is set via `CryptoProxy.setEndpoint`. Only one endpoint can be set at a time. To release an endpoint and possibly set a new one, call `CryptoProxy.releaseEndpoint`.

This package implements a worker pool `CryptoWorkerPool` that the apps can use as endpoint, out of the box:

```js
import { CryptoWorkerPool } from '@proton/crypto/lib/worker/workerPool';

async function setupCryptoWorker() {
    await CryptoWorkerPool.init(); // CryptoWorkerPool is a singleton
    CryptoProxy.setEndpoint(
        CryptoWorkerPool,
        (endpoint) => endpoint.destroy() // destroy the CryptoWorkerPool when the CryptoProxy endpoint is released
    );
}
```

Using workers is necessary since crypto operations are likely to freeze the UI if run in the main thread.

However, if you have an existing app-specific worker, you might not need to spawn separate workers, as described below.

<!-- ## App-specific workers -->

### Setting up CryptoProxy inside a worker (with separate key store than the main thread)

If a custom app worker needs to call the CryptoProxy (even indirectly, to e.g. use `@proton/shared` functions), it can create and use a CryptoApi instance directly, thus avoiding going through a separate worker to resolve the requests:

```js
import { Api: CryptoApi } from '@proton/crypto/lib/worker/api'
CryptoProxy.setEndpoint(new CryptoApi(), endpoint => endpoint.clearKeyStore());
```

Note that the CryptoApi imports OpenPGP.js, and it should not be used or imported in the main thread, but only inside workers (you might want to use dynamic imports in this sense).

The CryptoProxy initialized in this way is totally separate from the CryptoProxy initialized in the main thread, and it will not share key store with it. If you need a shared key store (which is preferable than trasferring keys manually to and from the worker), see the next section.

### Using custom worker as CryptoProxy endpoint for the main thread (with shared key store)

To have a single app-specific worker that takes care of some app-specific requests, as well as the CryptoProxy ones from the main thread, it's possible to extend the CryptoApi.

Example setup:

```js
// in `customWorker.ts`:
import { expose, transferHandlers } from 'comlink';

import { CryptoProxy, PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { Api as CryptoApi } from '@proton/crypto/lib/worker/api';
import { workerTransferHandlers } from '@proton/crypto/lib/worker/transferHandlers';

class CustomWorkerApi extends CryptoApi {
    constructor() {
        super();
        CryptoProxy.setEndpoint(this); // if needed, set endpoint (e.g. for @proton/shared) in the worker itself
    }

    // decrypt and encrypt to a different key, saving some communication overhead
    async reEncryptMessage({
        armoredMessage,
        decryptionKeys,
        encryptionKeys,
    }: {
        armoredMessage: string,
        decryptionKeys: PrivateKeyReference[],
        encryptionKeys: PublicKeyReference[],
    }) {
        const { data: binaryData } = await this.decryptMessage({ armoredMessage, decryptionKeys, format: 'binary' });
        return this.encryptMessage({ binaryData, encryptionKeys });
    }
}

// set up transfer handlers for the CryptoApi (you might have to set up your own as well)
workerTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));
// initialize underlying crypto libraries
CustomWorkerApi.init();

expose(CustomWorkerApi);
```

```js
// in main thread:
import { wrap, transferHandlers } from 'comlink';
import { mainThreadTransferHandlers } from '@proton/crypto/lib/worker/transferHandlers';
import { CryptoProxy } from '@proton/crypto';

const RemoteCustomWorker = wrap<typeof CustomWorkerApi>(new Worker(new URL('./customWorker.ts', import.meta.url)));
// set up transfer handlers for the CryptoApi (you might have to set up your own as well)
mainThreadTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));

async function doStuff() {
  // start the worker
  const customWorkerInstance = await new RemoteCustomWorker();
  // set it as CryptoProxy endpoint
  CryptoProxy.setEndpoint(customWorkerInstance);

  // the CryptoProxy requests will now be directed to your custom worker
  const oldKey = await CryptoProxy.importPrivateKey(...); // or `customWorkerInstance.importPrivateKey`
  const newKey = await CryptoProxy.generateKey(...); // or `customWorkerInstance.generateKey`

  // the custom functions need to be referenced directly, since the CryptoProxy is not aware of them
  await customWorkerInstance.reEncryptMessage({
    armoredMessage: '...',
    decryptionKeys: [oldKey],
    encryptionKeys: [newKey]
  });
}
```

## Testing

Chrome and Firefox are used for tests. With Chrome and Firefox installed, running test should work out of the box. To use a different Chromium-based browser, set the environment variable CHROME_BIN to point to the corresponding executable.
