These `subtle` helpers include are a small set of cryptographic primitives that can be efficiently run outside of web workers, as they rely on the browser's native WebCrypto API.

**Warning**: the exported primitives are fairly low-level, and can be misused (in subtle ways 😉) compromising security. The `CryptoProxy` should be used to access safer crypto functions, unless a specific design requiring `subtle` primitives has been discussed with the Crypto team.
