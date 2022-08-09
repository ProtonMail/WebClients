import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { CryptoApiInterface, CryptoProxy, VERIFICATION_STATUS, updateServerTime } from '../../lib';
import { Api as CryptoApi } from '../../lib/worker/api';

chaiUse(chaiAsPromised);

describe('CryptoProxy', () => {
    let api = new CryptoApi();
    it('setEndpoint - should throw if already set', async () => {
        CryptoProxy.setEndpoint(api);
        expect(() => CryptoProxy.setEndpoint(api)).to.throw(/already initialised/);
        await CryptoProxy.releaseEndpoint();
    });

    it('releaseEndpoint - should invoke callback', async () => {
        let called = false;
        CryptoProxy.setEndpoint(api, async () => {
            called = true;
        });
        expect(called).to.be.false;
        await CryptoProxy.releaseEndpoint();
        expect(called).to.be.true;
    });

    it('should use serverTime()', async () => {
        let passedDate = null;
        const mockApi: CryptoApiInterface = {
            generateKey: async ({ date }) => {
                passedDate = date;
                return {};
            },
        } as CryptoApiInterface;
        CryptoProxy.setEndpoint(mockApi);

        const now = new Date();
        const zero = new Date(0);

        updateServerTime(zero);
        // we don't care about returned value
        await CryptoProxy.generateKey({ userIDs: [], date: undefined }); // explicitly passing undefined should not overwrite the server time
        updateServerTime(now); // restore current time
        // the proxy is expected to pass the server time at each function call
        expect(passedDate).to.deep.equal(zero);

        await CryptoProxy.releaseEndpoint();
    });

    it('verifyMessage() - should verify signature over message with trailing spaces incorrectly normalised', async () => {
        CryptoProxy.setEndpoint(api);

        const armoredKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYvJTNBYJKwYBBAHaRw8BAQdAS4QHqABRYAf5eCH/iY6Q4AfdDqLrKYQz
TND/5puZH90AAP9sYypq0Tf5xhhmMdf1XGtLtTyBFnNFx+k4vxfuAjEwuQ++
zQ48dGVzdEB0ZXN0Lml0PsKMBBAWCgAdBQJi8lM0BAsJBwgDFQgKBBYAAgEC
GQECGwMCHgEAIQkQ5+2ErLwEs+cWIQQ8a87Tc2dD9ijDVZvn7YSsvASz522q
AQDXDqV6QtBVnL7kLXGB/V1xtyEXKPXtfyr1tp0mf2k2UwEAx+0YqWlM76JW
/SFs2nnwwFLMW8uhrssQcmTTDScVCwTHXQRi8lM0EgorBgEEAZdVAQUBAQdA
jYyYTDfSC6KeWzAev0CVq1LRsf7FXytrTashagvGXwsDAQgHAAD/a96w3SfZ
NVbSgVY/O63vGqT5pLSRfun6r5k8SVO+bEASqsJ4BBgWCAAJBQJi8lM0AhsM
ACEJEOfthKy8BLPnFiEEPGvO03NnQ/Yow1Wb5+2ErLwEs+eJMgD9HoKKixWh
oXrxfym9/JTYmc0nCAflvWrDYLBLj6EWKaUA/1N/Ai8kp2dBlhHclTMQDf9K
djRcL8vRk+sHWQXCJ1UH
=M5+8
-----END PGP PRIVATE KEY BLOCK-----
`;

        // standard cleartext message signature
        const signatureOverStrippedWhitespace = `-----BEGIN PGP SIGNATURE-----

wnUEARYKAAYFAmLyVbgAIQkQ5+2ErLwEs+cWIQQ8a87Tc2dD9ijDVZvn7YSs
vASz55e1AQDiYW/fvrwBzGC400v+0SYEKK5bZoPppQ5R9rGfcCDf2wD/QVmi
G9IB1OYHAKtneAqnZexj3JgnU1gTWMu6jMsUXQ8=
=Lv3B
-----END PGP SIGNATURE-----
`;

        // signature over data incorrectly normalised (trailing whitespace not stripped)
        const signatureOverTrailingWhitespace = `-----BEGIN PGP SIGNATURE-----

wnUEARYKAAYFAmLyU78AIQkQ5+2ErLwEs+cWIQQ8a87Tc2dD9ijDVZvn7YSs
vASz5yDVAP4kh41TVuc/r5hsEpuCGpDk1D6lJr/1uXvL/BqsQJPJ8gD/f23y
tE1tRB5+iYHzBnQVEeKN7T12E5zo1HShM7ntSgE=
=jcw/
-----END PGP SIGNATURE-----
`;

        const textData = 'BEGIN:VCARD\r\nVERSION:4.0\r\nFN;PREF=1:   \r\nEND:VCARD';

        const verificationKeys = await CryptoProxy.importPublicKey({ armoredKey });
        const { verified, data: verifiedData } = await CryptoProxy.verifyMessage({
            textData,
            armoredSignature: signatureOverStrippedWhitespace,
            verificationKeys,
            stripTrailingSpaces: true,
        });
        expect(verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
        // confirm data was normalised as expected
        expect(verifiedData).to.equal('BEGIN:VCARD\nVERSION:4.0\nFN;PREF=1:\nEND:VCARD');

        // test fallback verification
        const { verified: verifiedFallback, data: verifiedDataFallback } = await CryptoProxy.verifyMessage({
            textData,
            armoredSignature: signatureOverTrailingWhitespace,
            verificationKeys,
            stripTrailingSpaces: true,
        });
        expect(verifiedFallback).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
        // confirm that normalisation was not applied
        expect(verifiedDataFallback).to.equal(textData);

        await CryptoProxy.releaseEndpoint();
    });
});
