# DETERMINING THE SIZE OF YOUR CIPHERTEXT

## The general problem

You might find that the API is imposing a maximum of characters for some encrypted data. To meet this limit, you will probably need to impose some maximum on characters on the cleartext data.

One example where this happens in with the so-called purpose or label of a calendar URL link. We examine this example below and extract some bounds for it. The method could be easily generalized to other exampels.

## A concrete example: labels for calendar url links

The BE imposes a length limit of 2000 (base64) characters for the encrypted purpose. For the type of encryption used for encrypting the purpose, we can relate the length (in base64 characters) of the ciphertext, `L`, to the length (in bytes) of the clear text, `l`, with `h` being the length (in base64 characters) of the 'header & footer' `"-----BEGIN PGP MESSAGE----- -----END PGP MESSAGE-----"`, as:

```
L = 212 + f(l) + h ,
```

where the number 212 accounts for 159 bytes (or 212 base64 characters) of the different non-data packages that go into the PGP-armored message for encryption with an X25519 key (the ones used in Calendar), and f(l) is a function that converts the number of bytes of the clear-text UTF-8 string into the number of base64 characters after its AES encryption (which simply performs a byte-by-byte mapping) and base64 encoding. We can write the following inequality for the function that does this transformation:

```
f(l) >= 4/3 * (61/60 * l + 1) .
```

The 4/3 comes from the transformation from bytes to base 64 characters (it's an inequality because of the base64 padding), and the 61/60 comes from the fact that in the PGP formatting a new line is introduced every 60 characters (as `n + ceil(n/60) >= 61 / 60 * n + 1`).

Combining the two formulae above we can extract that

```
l <= 60/61 * (3/4 * (L - 53) - 160), which gives us l < 1278.93... if L < 2000 .
```

Because Javascript uses UCS characters (2 bytes per code point), we should divide by an extra factor of 2. Additionally, the size of the non-data packages depends on the type of key and encryption we use (e.g. it would be 182 bytes for an X25519 key with the AEAD coming in OpenPGP v5; it would be more with an X448 key).

To give a bit of margin for those extra non-data packages, and to round things up, we decided to leave the bound on l as l < 500. This leaves 950 bytes of space for the non-data packages.

### Testing the formulae

To test the two formulae above, we could take a couple of cases in which the inequality is saturated, e.g.:

```
l = 540 -> f(l) = 4/3*(l + ceil(l/60)) = 732 -> L = 997
```

```
l = 720 -> f(l) = 4/3*(l + ceil(l/60)) = 976 -> L = 1241
```

In JS, you could test that the results are correct with a couple of tests:

```JS
expect((await generateEncryptedPurpose({purpose: generateStringOfLength(540), publicKey: calendarKey})).length).toEqual(997);
expect((await generateEncryptedPurpose({purpose: generateStringOfLength(720), publicKey: calendarKey})).length).toEqual(1241);
```

Notice these tests could be broken as the document gets outdated, since the encryption mode can vary slightly and the non-date packages could take more space. However, the line of reasoning should remain correct.
