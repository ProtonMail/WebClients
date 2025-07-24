import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { CryptoProxy, canKeyEncryptAndDecrypt, getMatchingSigningKey } from '../../lib';
import { Api as CryptoApi } from '../../lib/worker/api';

chaiUse(chaiAsPromised);

describe('CryptoProxy helpers', () => {
    beforeAll(() => {
        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
    });

    afterAll(() => {
        void CryptoProxy.releaseEndpoint();
    });

    it('getMatchingSigningKey - it can get a matching primary key', async () => {
        const keyWithoutSubkeys = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYYqcWBYJKwYBBAHaRw8BAQdAesbhqiOxbLV+P9Dt8LV+Q8hRBLbwsSf6
emoCS30uQpEAAQDFgBruRj6Zqb0OULkaaNz+QK4+gvc006UtTgz2wdrP8xFv
zRE8ZW1haWwyQHRlc3QuY29tPsKMBBAWCgAdBQJhipxYBAsJBwgDFQgKBBYA
AgECGQECGwMCHgEAIQkQJCJW2HYCeYIWIQTdZGjv9WwTyL+azOUkIlbYdgJ5
gm9nAQDY//xzc2hy6Efz8NqDJeLg1lh2sZkKcMXP3L+CJbhWJQEAuI6UDakE
+XVcDsBS+CIi3qg74r/80Ysb7tmRC06znwA=
=I0d7
-----END PGP PRIVATE KEY BLOCK-----`;

        const keyWithSigningSubkey = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYYqb5xYJKwYBBAHaRw8BAQdA0zCRw6gyovlI8V6pQoDtmAoIr7YPNPxm
jQa5PfiQq5gAAQDQ1o8+YXQg34FUNbbo+PUuRDAar37n9RFQiNrkH+vvlBHW
zRA8ZW1haWxAdGVzdC5jb20+wowEEBYKAB0FAmGKm+cECwkHCAMVCAoEFgAC
AQIZAQIbAwIeAQAhCRCqDK8y54tXERYhBELBCpl0aMYXdXBljKoMrzLni1cR
v44BAI826OYoikU8aMs6wBiHd/SVqPU/ZVLz5VUGriEkJoqGAPwLOztUuX1Q
zmtAq8mQUQjlrmAm50DctKQeug8rrn30BcdYBGGKm+cWCSsGAQQB2kcPAQEH
QGNOppjS4p71QAy6MvBX6JK9zt8YeUo7dm4b7RaFq0ejAAD/ZcyhjL8LEIZO
t/8qU7LJn+lxPSl6tFZ7TBgXj4RkldMQccLALwQYFgoACQUCYYqb5wIbAgCY
CRCqDK8y54tXEXYgBBkWCgAGBQJhipvnACEJEF5S2ZJhJACOFiEElQ0ZXBPe
9UZzI0KoXlLZkmEkAI6EuQD+JRU3Z+u6RHCRdKupZlLuzCFzWmvJvZGktcuQ
40bYgFQA/iwWv5vDkw8zTxw5GRTahnnp0shs/YOG4GgB6EHXom8FFiEEQsEK
mXRoxhd1cGWMqgyvMueLVxHYNAD+NaLEsrzFxvgu3c8nVN5sjVETTZZdHjly
wSeOoh9ocbsA/joCCpHxxH061g/tjEhP76tWJX17ShZ9wT7KZ6aPejoM
=FkBc
-----END PGP PRIVATE KEY BLOCK-----`;

        const key1 = await CryptoProxy.importPrivateKey({ armoredKey: keyWithSigningSubkey, passphrase: null });
        const key2 = await CryptoProxy.importPrivateKey({ armoredKey: keyWithoutSubkeys, passphrase: null });

        const signatureFromSubkey = await CryptoProxy.signMessage({
            textData: 'a message',
            signingKeys: key1,
            detached: true,
        });

        const signatureFromPrimaryKey = await CryptoProxy.signMessage({
            textData: 'a message',
            signingKeys: key2,
            detached: true,
        });

        expect(
            await getMatchingSigningKey({ armoredSignature: signatureFromSubkey, keys: [key1, key2] })
        ).to.deep.equal(key1);
        expect(
            await getMatchingSigningKey({ armoredSignature: signatureFromPrimaryKey, keys: [key1, key2] })
        ).to.deep.equal(key2);
    });

    it('getMatchingSigningKey - it prefers v6 keys when preferV6Key is set', async () => {
        const v4KeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYYqcWBYJKwYBBAHaRw8BAQdAesbhqiOxbLV+P9Dt8LV+Q8hRBLbwsSf6
emoCS30uQpEAAQDFgBruRj6Zqb0OULkaaNz+QK4+gvc006UtTgz2wdrP8xFv
zRE8ZW1haWwyQHRlc3QuY29tPsKMBBAWCgAdBQJhipxYBAsJBwgDFQgKBBYA
AgECGQECGwMCHgEAIQkQJCJW2HYCeYIWIQTdZGjv9WwTyL+azOUkIlbYdgJ5
gm9nAQDY//xzc2hy6Efz8NqDJeLg1lh2sZkKcMXP3L+CJbhWJQEAuI6UDakE
+XVcDsBS+CIi3qg74r/80Ysb7tmRC06znwA=
=I0d7
-----END PGP PRIVATE KEY BLOCK-----`;

        const v6KeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xUsGZ69lHRsAAAAgVKlx8eYAIOBVBVpxPNqsLnus1dGQ7jPHBrF2H24CTy4A
574mWSzNUGD8wbHpEulvMiXlp65c31+/pGmTN0F9olTCrQYfGwoAAAA+BYJn
r2UdAwsJBwUVCggODAQWAAIBApsDAh4BIqEGG/XMiDtnfzWcO7DzDGBjPqzI
Wo3M5+R/Mc1MMXo6BhMAAAAACkMgAdsvZQOpYhY0HziOIYxdsJEdXayCBPZj
AWj0ogZ9Y4lgiPZBloC2Fi8xT55ojSot+cbDHxZGGLdcPo+cyidAk9vgc2ds
uJswWsaEaRyQVZ4NVEkXjLi4ennFLlH7RBkDzT1za2wtdGVzdEBoYXdraW5n
LnByb3Rvbi5ibGFjayA8c2tsLXRlc3RAaGF3a2luZy5wcm90b24uYmxhY2s+
wpsGExsKAAAALAWCZ69lHQIZASKhBhv1zIg7Z381nDuw8wxgYz6syFqNzOfk
fzHNTDF6OgYTAAAAAHOdINNMw/Tct0I36gNQj+bt6xYMbrtF7eboTkYe98fY
VCOY7JzmrBaMNnvKPjoERvLbFOSFRlruA2SLAOyl07WjbG9dVKqLWYv/f37L
FFMDnEaL6C2tL7KSL5Ptz9MflW7kAMdLBmevZR0ZAAAAIPB/B5bC0WUsrIc1
IequM/MqcH//zOngora2+qzMp0hyAMGGoBR4IMJZrfUbbNL/rF3ysTHVAKOp
LyGKcuBsatCUwpsGGBsKAAAALAWCZ69lHQKbDCKhBhv1zIg7Z381nDuw8wxg
Yz6syFqNzOfkfzHNTDF6OgYTAAAAABMtIOoLxS/VsxYF/D5UDAXKa7sIzkyb
B8rlCKMa0LAwjScEdLOntdgoYTrLJknRI+Y5byS70CAWAGoFYHIDQGevwX6G
4WSIscmKhb+4m9gNR8CkzBw5Dt6X0nC7mZbkbLkHBA==
-----END PGP PRIVATE KEY BLOCK-----`;

        const v4Key = await CryptoProxy.importPrivateKey({ armoredKey: v4KeyArmored, passphrase: null });
        const v6Key = await CryptoProxy.importPrivateKey({ armoredKey: v6KeyArmored, passphrase: null });

        const signatureFromBothKeys = await CryptoProxy.signMessage({
            textData: 'a message',
            signingKeys: [v4Key, v6Key],
            detached: true,
        });

        expect(
            await getMatchingSigningKey({ armoredSignature: signatureFromBothKeys, keys: [v4Key, v6Key] })
        ).to.deep.equal(v4Key);
        expect(
            await getMatchingSigningKey({
                armoredSignature: signatureFromBothKeys,
                keys: [v4Key, v6Key],
                preferV6Key: true,
            })
        ).to.deep.equal(v6Key);
    });

    it('canKeyEncryptAndDecrypt - it detects that a key cannot encrypt', async () => {
        const signOnlyKey = await CryptoProxy.generateKey({ userIDs: { email: 'test@test' }, subkeys: [] });
        expect(await canKeyEncryptAndDecrypt(signOnlyKey)).to.equal(false);
    });
});
