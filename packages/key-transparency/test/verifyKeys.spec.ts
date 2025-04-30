import { CryptoProxy } from '@proton/crypto';

import { verifySKLSignature } from '../lib/verification/verifyKeys';

const sklWithV6Key = {
    MinEpochID: null,
    MaxEpochID: null,
    ExpectedMinEpochID: 1,
    Data: '[{"Primary":1,"Flags":3,"Fingerprint":"4b4f9b2835d7c629e1a544efc1a438bcc21845ce","SHA256Fingerprints":["dfb6288abc061d287c362df18be5cffa4f90d92a4ec06a30ea44668747c3e63b","82d0f72cccede7187dd98ed96d36ea021d4944a030ebf594ee9e03201a8c3183"]},{"Primary":1,"Flags":3,"Fingerprint":"1bf5cc883b677f359c3bb0f30c60633eacc85a8dcce7e47f31cd4c317a3a0613","SHA256Fingerprints":["1bf5cc883b677f359c3bb0f30c60633eacc85a8dcce7e47f31cd4c317a3a0613","762d96c87a3d8719ed83a9fc814d6ee31ec3459b6ebc3c7a349ad47b5bb26500"]}]',
    ObsolescenceToken: null,
    Revision: 2,
    Signature:
        '-----BEGIN PGP SIGNATURE-----\nVersion: ProtonMail\n\nwsAvBAEWCgChBYJnr2VZCZDBpDi8whhFzjMUgAAAAAARABljb250ZXh0QHBy\nb3Rvbi5jaGtleS10cmFuc3BhcmVuY3kua2V5LWxpc3RFFAAAAAAAHAAgc2Fs\ndEBub3RhdGlvbnMub3BlbnBncGpzLm9yZzqHk+UJXoZrMschgzGlL09pOtox\nZPmbV9Cw4teP9l8rFiEES0+bKDXXxinhpUTvwaQ4vMIYRc4AAMvvAP0Ru1w7\n/wBl6//4o3Id0ND7gcLLfp9lXvwsOqVtid3FcAEAi7DqhFcmfPIklt2IETE3\niZVaSY1lg6jgWJ5WwWYNPgjCwAwGARsKAAAAXQWCZ69lWTMUgAAAAAARABlj\nb250ZXh0QHByb3Rvbi5jaGtleS10cmFuc3BhcmVuY3kua2V5LWxpc3QioQYb\n9cyIO2d/NZw7sPMMYGM+rMhajczn5H8xzUwxejoGEwAAAACGdCCy+F1Npi4v\nXzevIYpUf8FTmaPslAe5YenLy89CS0wTnzVC6jNMCc2Z2KCLxGKS8tsqsjEr\n2vrKRNtiyLxb+brpXFN3AFI4FlgJfhw7kmTF0lKVmAxKEgGmUQ9wsho+7gQ=\n=irHr\n-----END PGP SIGNATURE-----\n',
};

const v4PrimaryArmoredKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZ69jwxYJKwYBBAHaRw8BAQdA9UUu1JfqEjhKROFhPthl/Fs/lUfh0/8/
Cok/5HCh0ibNPXNrbC10ZXN0QGhhd2tpbmcucHJvdG9uLmJsYWNrIDxza2wt
dGVzdEBoYXdraW5nLnByb3Rvbi5ibGFjaz7CwBEEExYKAIMFgmevY8MDCwkH
CZDBpDi8whhFzkUUAAAAAAAcACBzYWx0QG5vdGF0aW9ucy5vcGVucGdwanMu
b3JnqIarsigu7v6gNekLjzLMkXF5vlptVNZ1Cq2kWx55ZDMDFQoIBBYAAgEC
GQECmwMCHgEWIQRLT5soNdfGKeGlRO/BpDi8whhFzgAAxToA/A/LjXe6w/m3
dFSRFgr5peaoDreY/bLxWZUGnstYOEtGAP0QnpuBmLKgFCRnmcQMA4ceP64r
pYy/DzkYDdLNFL9yBs44BGevY8MSCisGAQQBl1UBBQEBB0DNXGAnaETSAIO5
6WgaU6Kn76DvfHU4+6r3QW3PFRz/JgMBCAfCvgQYFgoAcAWCZ69jwwmQwaQ4
vMIYRc5FFAAAAAAAHAAgc2FsdEBub3RhdGlvbnMub3BlbnBncGpzLm9yZ+w2
TBxKG2xlJrU3mFN+Oob/OVySMlOeQPCovbadiQwKApsMFiEES0+bKDXXxinh
pUTvwaQ4vMIYRc4AAEShAP97V6EAZrmN6Nyy+a7s6UxltY51RmYjMTLsYqiu
lIIEYgD6AlCqOCRwc0JaEruepagkqP4d+bvgS3JPeEUVUbk1XAk=
=2qeD
-----END PGP PUBLIC KEY BLOCK-----`;

const v6PrimaryArmoredKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xioGZ69lHRsAAAAgVKlx8eYAIOBVBVpxPNqsLnus1dGQ7jPHBrF2H24CTy7C
rQYfGwoAAAA+BYJnr2UdAwsJBwUVCggODAQWAAIBApsDAh4BIqEGG/XMiDtn
fzWcO7DzDGBjPqzIWo3M5+R/Mc1MMXo6BhMAAAAACkMgAdsvZQOpYhY0HziO
IYxdsJEdXayCBPZjAWj0ogZ9Y4lgiPZBloC2Fi8xT55ojSot+cbDHxZGGLdc
Po+cyidAk9vgc2dsuJswWsaEaRyQVZ4NVEkXjLi4ennFLlH7RBkDzT1za2wt
dGVzdEBoYXdraW5nLnByb3Rvbi5ibGFjayA8c2tsLXRlc3RAaGF3a2luZy5w
cm90b24uYmxhY2s+wpsGExsKAAAALAWCZ69lHQIZASKhBhv1zIg7Z381nDuw
8wxgYz6syFqNzOfkfzHNTDF6OgYTAAAAAHOdINNMw/Tct0I36gNQj+bt6xYM
brtF7eboTkYe98fYVCOY7JzmrBaMNnvKPjoERvLbFOSFRlruA2SLAOyl07Wj
bG9dVKqLWYv/f37LFFMDnEaL6C2tL7KSL5Ptz9MflW7kAM4qBmevZR0ZAAAA
IPB/B5bC0WUsrIc1IequM/MqcH//zOngora2+qzMp0hywpsGGBsKAAAALAWC
Z69lHQKbDCKhBhv1zIg7Z381nDuw8wxgYz6syFqNzOfkfzHNTDF6OgYTAAAA
ABMtIOoLxS/VsxYF/D5UDAXKa7sIzkybB8rlCKMa0LAwjScEdLOntdgoYTrL
JknRI+Y5byS70CAWAGoFYHIDQGevwX6G4WSIscmKhb+4m9gNR8CkzBw5Dt6X
0nC7mZbkbLkHBA==
-----END PGP PUBLIC KEY BLOCK-----`;

describe('verifySKLSignature', () => {
    it('should return signature timestamp when any of the keys are provided and verify the signature', async () => {
        const v4PrimaryKey = await CryptoProxy.importPublicKey({ armoredKey: v4PrimaryArmoredKey });
        const v6PrimaryKey = await CryptoProxy.importPublicKey({ armoredKey: v6PrimaryArmoredKey });
        const verificationTimestampV4 = await verifySKLSignature({
            verificationKeys: [v4PrimaryKey],
            signedKeyListData: sklWithV6Key.Data,
            signedKeyListSignature: sklWithV6Key.Signature,
        });
        expect(verificationTimestampV4).not.toBeNull();

        const verificationTimestampV6 = await verifySKLSignature({
            verificationKeys: [v6PrimaryKey],
            signedKeyListData: sklWithV6Key.Data,
            signedKeyListSignature: sklWithV6Key.Signature,
        });
        expect(verificationTimestampV6).not.toBeNull();
    });

    it('should return null when the SKL signature cannot be verified', async () => {
        const extraneousKey = await CryptoProxy.generateKey({ userIDs: { email: 'test@test.it' } });
        const verificationTimestamp = await verifySKLSignature({
            verificationKeys: [extraneousKey],
            signedKeyListData: sklWithV6Key.Data,
            signedKeyListSignature: sklWithV6Key.Signature,
        });
        expect(verificationTimestamp).toBeNull();
    });
});
