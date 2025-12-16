import type { PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { utf8StringToUint8Array, uint8ArrayToUtf8String } from '@proton/crypto/lib/utils';

import { EVENT_VERIFICATION_STATUS } from '../../lib/calendar/constants';
import {
    decryptCard,
    getAggregatedEventVerificationStatus,
    getNeedsLegacyVerification,
    verifySignedCard,
} from '../../lib/calendar/crypto/decrypt';

const { SIGNED_AND_VALID, SIGNED_AND_INVALID, NOT_SIGNED } = VERIFICATION_STATUS;
const { SUCCESSFUL, NOT_VERIFIED, FAILED } = EVENT_VERIFICATION_STATUS;

describe('reduceBooleaArray()', () => {
    it('should return undefined for the empty array', () => {
        expect(getAggregatedEventVerificationStatus([])).toEqual(NOT_VERIFIED);
    });

    it('should return SUCCESSFUL when all array entries are SUCCESSFUL', () => {
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, SUCCESSFUL, SUCCESSFUL])).toEqual(SUCCESSFUL);
    });

    it('should return FAILED if some array entry is FAILED', () => {
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, NOT_VERIFIED, FAILED])).toEqual(FAILED);
        expect(getAggregatedEventVerificationStatus([FAILED, SUCCESSFUL, SUCCESSFUL])).toEqual(FAILED);
        expect(getAggregatedEventVerificationStatus([undefined, FAILED, SUCCESSFUL])).toEqual(FAILED);
    });

    it('should return undefined for any other case', () => {
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, undefined, SUCCESSFUL])).toEqual(NOT_VERIFIED);
        expect(getAggregatedEventVerificationStatus([NOT_VERIFIED, SUCCESSFUL, SUCCESSFUL])).toEqual(NOT_VERIFIED);
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, undefined, NOT_VERIFIED])).toEqual(NOT_VERIFIED);
    });
});

describe('getNeedsLegacyVerification()', () => {
    it('should return false if verification as binary succeeded', () => {
        expect(getNeedsLegacyVerification(SIGNED_AND_VALID, 'test')).toEqual(false);
    });

    it('should return false if verification as binary returned that the card is not signed', () => {
        expect(getNeedsLegacyVerification(NOT_SIGNED, 'test')).toEqual(false);
    });

    it('should return false if the card does not contain neither trailing spaces nor "\n" end of lines', () => {
        const card = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:ME74ALdqllOjZfMWzIcF-nFQNMVC@proton.me\r\nDTSTAMP:20230310T154953Z\r\nSUMMARY:test\r\nDESCRIPTION:no line jumps\r\nEND:VEVENT\r\nEND:VCALENDAR`;
        expect(getNeedsLegacyVerification(SIGNED_AND_INVALID, card)).toEqual(false);
    });

    it('should return false if the card does not contain neither trailing spaces nor "\n" end of lines, but has escaped "\n" characters', () => {
        const card = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:ME74ALdqllOjZfMWzIcF-nFQNMVC@proton.me\r\nDTSTAMP:20230310T154953Z\r\nSUMMARY:test\r\nDESCRIPTION:some \\nescaped \\nline\\n jumps\r\nEND:VEVENT\r\nEND:VCALENDAR`;
        expect(getNeedsLegacyVerification(SIGNED_AND_INVALID, card)).toEqual(false);
    });

    it('should return true if the card has trailing spaces', () => {
        const card = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:ME74ALdqllOjZfMWzIcF-nFQNMVC@proton.me\r\nDTSTAMP:20230310T154953Z\r\nSUMMARY:test\r\nDESCRIPTION:A long description with an RFC-compliant \r\n line jump\r\nEND:VEVENT\r\nEND:VCALENDAR`;
        expect(getNeedsLegacyVerification(SIGNED_AND_INVALID, card)).toEqual(true);
    });

    it('should return true if the card uses "\n" as end of line character', () => {
        const card = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:ME74ALdqllOjZfMWzIcF-nFQNMVC@proton.me\nDTSTAMP:20230310T154953Z\nSUMMARY:test\nDESCRIPTION:no line jumps\nEND:VEVENT\nEND:VCALENDAR`;
        expect(getNeedsLegacyVerification(SIGNED_AND_INVALID, card)).toEqual(true);
    });

    it('should return true if the card mixes "\r\n" and "\n" as end of line characters', () => {
        const card = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\nUID:ME74ALdqllOjZfMWzIcF-nFQNMVC@proton.me\r\nDTSTAMP:20230310T154953Z\nSUMMARY:test\nDESCRIPTION:no line jumps\nEND:VEVENT\nEND:VCALENDAR`;
        expect(getNeedsLegacyVerification(SIGNED_AND_INVALID, card)).toEqual(true);
    });

    it('should return true if the card has unescaped "\n" characters', () => {
        const card = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:ME74ALdqllOjZfMWzIcF-nFQNMVC@proton.me\r\nDTSTAMP:20230310T154953Z\r\nSUMMARY:test\r\nDESCRIPTION:some \nunescaped \nline jumps\r\nEND:VEVENT\r\nEND:VCALENDAR`;
        expect(getNeedsLegacyVerification(SIGNED_AND_INVALID, card)).toEqual(true);
    });
});

describe('signature verification', () => {
    // async not supported in describe
    let verifyingKey: PublicKeyReference;
    beforeAll(async () => {
        verifyingKey = await CryptoProxy.importPublicKey({
            armoredKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----

xsFNBGQUNeUBEADg4jzbHQuuSN3DBIpr9+BchSpW7lKuyC1A5SWoVfoXp8Kh
ExDpJW0uIxYBkFxf1M+HrwFQ60Z5HCh2tn9j/fVT7N+cYoJ9b4Ux6vb4XPgn
fczhGZBQu+RuGnP1pk+BThdQmL4qmbz4Lhs6TmsrC+j8nZmETmlpjnzenZnr
HDPt+7dXDAwSLgYtoF/ai/4BGRKJSNZqQGCJHAczyDcruyTGboQwYTgY6DCQ
uDDpfvQyipfi2YrPSXfMMiq58/oN5xJVF8KBDjEGRsGAnjjLzD9ESS23lEFc
yBFq8ZnQ1zEAvsi2pM2t4d1WN4j+XHl15OtF320IZwhFpWbWwF5BensF9C7q
QGv53S/yxtynhxFe5LLIX6xCoPAx9ztEpQ7vCNWAxfuEuD2h6YH7uto4SEdG
yFFjqhTGfoMGf8e6vHDqG0lhQ64ihrkChHuoFoNOKctd+AzAf+jwBYFcLfaR
DTzXGhLSU2htY1y0eMCCX3FKxs2aED4mKP9/33wboFaJsXDfzBwuirUaOeGu
ypbe59SWSweSd3xMk4hs6g0rujgK43zqhHwbfANOYKxMO/DaNAQ1CejdTQFF
WjKB5c3i4do53bDPvSuInKg47hJebusgtQ35tAMQ8sW5u/w6MdKYnToO5drI
nh1Rh+f1hg901LgGju5cjWQK+AGrdNFh/sz15wARAQABzSttYXJpbi50ZXN0
QHByb3Rvbi5tZSA8bWFyaW4udGVzdEBwcm90b24ubWU+wsGKBBABCAA+BYJk
FDXlBAsJBwgJkDdgL12b05omAxUICgQWAAIBAhkBApsDAh4BFiEEnvjO48DO
r/B5ikD/N2AvXZvTmiYAAB2eEACZbAVMTop1HWLmO/2Yxfn1yBFeUQ9mnni6
GrxTXLwuOA1pZTApaI25pncSwlx3fGJk8/gaIr9flITWSZlmfOF2LWNdSMDc
UMa86XTJtt6OO8jX+Kc8DJgDHAzyC0CzaY/hMI0ptg5kOmOF8OuCTTZYDSbP
bbw+t59krKHM4Tv7M2zeaejt2nlgaUqxmxy9my3inf5dp0nDRPr/G7pUXqYL
WMrmwmrVCaFf9YVjUDxanu4OxjdSbpdaY0XB8zmWOqItQME25wnQRn1r4T3e
d4uo8AkiHR/edp3wAjKPP0dPacKnoWhYk5ExoETacUWRbdgEQscEeb5nOYTm
3dXWP/ZrlW1+amJ/BV6pgD7llVUEQbk9k3MS3kL8hQ4C2XhXsXSTrkHI8K52
2ITIjuNcRQcCza6XModHxY4Z0rSajPKU8Rii1caFm+q9w+IpvbcG6Ews5WCC
/L+3ypXlKo8R8IJSaHO/O4pz48+UL3shNouXnzULZPZTjCYaartRTioU9WZ8
lVcKWSRuI4fVGItRaQg7VB+BxcDihhEAl/XrYVS6SV+vQG65M7qyj5vqzkBj
CLoeQnCCHe0mgttrVGqcmIfDXZ+S0NSPM23jcOTMof1/FVKQPs9ARO1QDx2s
00o5F1s5FX16AQaFPzwTMJQndH/9wTFbXaCDIRefrWM3kCUMgc7BTQRkFDXl
ARAAlFWpetM2HgUA2JjJFtzNuaCII4RxULgG7qx5DLB2mNlLNS3EmSzAkDpQ
kOTzebMjEX2Cqs/d3L0CNH/xdGElirt6q4YH+QNcCbzLpTGSlEfaE1oljEp4
MlfB312cFahDl7Z4ScDaunPFRtbk0FBe0gpsRZE6z1ax2V5vEP66q0nJlYuB
iOIkPwWKjp1y/l2afSxmUM7gtCZdHdQkwMA9KNK5NYlkPyZWMCNgcGARyQWW
F/kOhBFHUZBlotrk83JLOGNy++DNH490LdBhwwFbbzpp6BiprphcdGbddrCJ
uNVaX+Kr4R5+Rysf5ilGOBW7+A+Tn3b2rJnE4iyeO6zCJUwTn087o2hYC9bw
+AhMx2Q9RozNQn3o0aECD+AehiZpK20PXkaK2tJe9j48HLp9dgfrpCY8uKrH
PrijUWU7LFdx6Y1b7MbgBcwveybeM3MdofKyfFXiXdTf3tU/UCYBBSw2ez2y
YjiocMovVxfl1RLb9BoTlcaCYFv2gImjKtb2/aak8fVI7F41pdVZaUY1ptiW
V+bJnRlyGehvRxWIYkAhWeuHeIzQH03fRlFlEGam1k4CFdcvR2WR3fLtt7CE
ugJYMnEpuXSk3XRZ8DofW4hMiKz195TjvtA9JCiYtA+Avxxkz/oBrDcqBabM
NLa4fjEj4fvFqFMjvBekSG86PMsAEQEAAcLBdgQYAQgAKgWCZBQ15QmQN2Av
XZvTmiYCmwwWIQSe+M7jwM6v8HmKQP83YC9dm9OaJgAAZjUQANLVg/Oy3rjE
A+jAZQPHgB6Vuz+1E6gQb05PrT0TWsy+mxWX0Fgl37y4F5aHkOjmU3Wjwv0T
bJuPnKHDDBdeiwDkmGizu/dF1oU22kvQxsLSya/JQ2MKuFukS2q5C4ynJxBK
3zWvIi9+u7zF+qrnqRRPQkt8lzrVMn8fwBdpLAY6BkCjq08Nb7rhOPgR1IHy
oRtbrN0/oow4xXPopNmURuDTPCDNzQffqVdlk+Y3IYWCacyLqKHr+N69Zmd8
rmN3TuBsdhAclak4UAdZpvatopn6xmmjRP4ASrLcibD1uEfQtu8K23c6w5Mh
/gu9BgSWi2XTIKl8RAjDT4RIDedBwDEEW28/VSNctq3/cTnzF8agirWGbi+J
QCMu5XiXxlpaVTJqYP8i9rBiInEWVi6awniBGlc1KvXkWnHS9anq3YpVEn5z
6GEqOvKbQkocRUC+PWPh8cn/59DeCU0z+ZRPh1JwbcczlNOh/Q4bEPpNX1CC
I82ZxY1uW1RzVPaivVmcmLTdJwQisk7Ly8UIuWPFZgpPqukkX4EkRr80pCyD
5ftJ3/q73HLgwUBlouFJYtRpedpED+GnrLmwwMocE/abtfFQOAEeOF+36PQH
rVrK/CBryY6A1Ofspib3HcxfpFrGB4EQ9uLGKGfHtVC2ffrb+vKBiFXjb0Hx
4inhR0I+BumP
=QACS
-----END PGP PUBLIC KEY BLOCK-----`,
        });
    });

    it('should verify RFC-compliant events with trailing spaces signed in binary', async () => {
        const signedCard =
            'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Proton AG//web-calendar 5.0.9.0//EN\r\nBEGIN:VEVENT\r\nUID:OQsJdD-wpvq8SSouey3Cp0L3zMUu@proton.me\r\nDTSTAMP:20230317T094504Z\r\nDTSTART;TZID=Europe/Zurich:20230316T110000\r\nDTEND;TZID=Europe/Zurich:20230316T163000\r\nSEQUENCE:1\r\nEND:VEVENT\r\nEND:VCALENDAR';
        const signatureSignedCard = `-----BEGIN PGP SIGNATURE-----

wsFzBAABCAAnBYJkFDagCZA3YC9dm9OaJhYhBJ74zuPAzq/weYpA/zdgL12b
05omAAAv3RAAylxnTDoGhwPVWIeQ8YawgriM7PTzti7VOSiZoa5qZA2AUNdN
U5yzwMPKjS6lqPqMjt3K3qHDKwLP3x+zXUJltmLhf5O8AP6HX3z21iyrCz0d
fs4PwoWWhhL42/JGz7pSkXd7UCBf5CdtEnEJndjVdmTNtqATLdSMA2acHSvp
F4j6qwDz/IUccVMBPdCNr7aUdhvrgmRLEeux670vuYXoCOYp7FP4+nqFiZyj
uNOVKyr7pLNoExr/Mr7oeO+vWtQQmCqFv0l0eB15iJvoqxADaubhxlyH66Mg
IDKvJ0dgDYkXpp792FAFS5KQmYu3fWvaKI9JDcP7GlxhK8PctxArEHb0Yw4Z
tznIdv4fpBMij7tKZUPaXa44E1eaLAh0cLmE43pEe72su3ApIXOFNwCoG2wY
2oFlqzveqSAxUO7KFjHHKfQsLP87W2LN9SJIirS79oczc44I7JLCTiZK0QBE
L5mlVWhx64WrO3IuG3zLo1zHVJr0b8bbomXc7QpzBZeSWu6gk8TzXbuq+cXM
WVzSaiIYkiAIJ+3Il0eVXRDByHSlbiARUXwTbYTInGJTZlojiYGRKLg3RZVh
rYPisW+K5qDtxDwtSzh7enrioaYjmNkxAl9ITrW3KIWpj6T9T8Y6nF1XZjoW
Os/jRyUaMIniPF2OLQ3H8twvnNLYQiikaPY=
=3DyY
-----END PGP SIGNATURE-----`;

        const { verificationStatus: verificationStatusSignedCard } = await verifySignedCard(
            signedCard,
            signatureSignedCard,
            verifyingKey
        );
        expect(verificationStatusSignedCard).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);

        const encryptedAndSignedCard =
            '0sCOAYco/2YnDOqysm4O2mcSAfTogGJw5YjQEz+pcS7tWUjXiNyVWJfrClgdTdW13kwb/CKrMmj0W2gQp4Sg6AwCTrxpgL1MFPU5yNv1Dy/oRX9wLP62AMCvlLfEvbncEVEiArt13RMtge9TH87t6FAYunCGS/tY8rBZN1rm4jvgn9WPeOzuVDAAtTvo0QG3FO2gtHr5MIdXekc1JzNwVY4YqxYxpHgAjTVa+L2EKSS66a5UcE//DvSAGsGOhJs0oncK1fWKxBbT/a3tbolh6Ay7LwXjJBLU+koJfDUOX1lwOuS+93ES3EiD8uYstFIjutFgOEXO91ZnsxEeswQGZWzhoC0A72mFrC+CSw41Z4hZ5wfEwZEG0SfHVnlVoSB0veKkDBPjFWFLKloX+H4YwM0ueX+hgCCKMihlvsb+wC/gLH00jakaeWkZM4cw9wl1Vw==';
        const sessionKey: SessionKey = {
            data: Uint8Array.fromBase64('Rxpha2U2xhoE1iP7W9l/EmfTTYEv8ZLHKDYuzQU86nQ='),
            algorithm: 'aes256',
        };
        const signatureEncryptedAndSignedCard = `-----BEGIN PGP SIGNATURE-----

wsFzBAABCAAnBYJkFDagCZA3YC9dm9OaJhYhBJ74zuPAzq/weYpA/zdgL12b
05omAAA2qA/+KOmoAYaPvQnWvKarS9kso1CUQKtz2L43fGE4kgTXjvX6/gGV
5S8QU4R6/sWwqEFSncHVnglmV8qovIinNzoIcNDSr31zCxg8+ZsUUROSPeW9
k/LZR/VP4ksYioGuH/7chZyATmflq4vPQtvzmAXxX+P0UnAHBbNZ1Dba6xq+
apeocgcp8SlVVU4PRvgXY1T8YlyoplGEvsfp3dlDNi4QRd3reisZJbaMAYpr
ZhjNdwT5Mv22wckshkbu+BvKscyW1rNjfkJaBy5f3Wr/+hsHV8+0tPZPVRz2
UE7xVImDyWMLaof43qK5Q4IdPm1xG535ntJ5mbJPCmzObu3izbq71rv9LLH4
w8f18XN9H6MxKVvY9+uinKIpSVpiKVhKEbVcCrtTAl+B/5qpmz2dcikZ0Ump
cB/vS7v2RgaSaxuu1SK+Sk4JZYcZ/9Xbjaegf26d+cxpoJLxrrQNuozWA1eb
LG9QkIsX5b0VepUBvrln1AA4bXUM0nAoUzrhz4vH5yGM55sbW9rnf0GxOihx
49NAfi0SOLmuzn8HAiLwbfpV4R9CBKu6DMNb6pBloyaBBKLMNDjttP59MEdt
rHe09o7AZP4WmjAhwFP5piIU91IRSI8ZLKaogcb1UmEWvdstnyJKM7R3zFkX
TIurHadAqGSqqTU7bb+jQCWD1RLDbwhIgkg=
=FPS1
-----END PGP SIGNATURE-----`;

        const { data, verificationStatus: verificationStatusEncryptedAndSignedCard } = await decryptCard(
            Uint8Array.fromBase64(encryptedAndSignedCard),
            signatureEncryptedAndSignedCard,
            verifyingKey,
            sessionKey
        );
        expect(data).toEqual(
            'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Proton AG//web-calendar 5.0.9.0//EN\r\nBEGIN:VEVENT\r\nUID:OQsJdD-wpvq8SSouey3Cp0L3zMUu@proton.me\r\nDTSTAMP:20230317T094504Z\r\nSUMMARY:Australian Brandenburg Orchestra concert: Ottoman Baroque with the \r\n Whirling Dervishes\r\nEND:VEVENT\r\nEND:VCALENDAR'
        );
        expect(verificationStatusEncryptedAndSignedCard).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);
    });

    it('should verify non-RFC-compliant events with trailing spaces signed as text (legacy Web, tweaked to use "\n" as EOL in signed cards; without tweak it would use "\r\n")', async () => {
        const signedCard = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Proton AG//web-calendar 5.0.9.0//EN
BEGIN:VEVENT
UID:jMya8Q_DfmpSWN9MdRAvdncAmLY-@proton.me
DTSTAMP:20230317T124114Z
DTSTART;TZID=Europe/Zurich:20230315T110000
DTEND;TZID=Europe/Zurich:20230315T163000
SEQUENCE:1
END:VEVENT
END:VCALENDAR`;
        const signatureSignedCard = `-----BEGIN PGP SIGNATURE-----

wsFzBAEBCAAnBYJkFGJSCZA3YC9dm9OaJhYhBJ74zuPAzq/weYpA/zdgL12b
05omAACwaQ//eQ75ZFW1QOFZDpR4wB0GAMgCmsINrgGo47qZ89l/DnYitLc5
eg6hSttPpdED146m0E8IR7l5fupkcLqVRFUitn7HBipfyFhuzSbsisDPPppV
/4OIojOXtLdg91w6juhxuornhwV0+3FjMvukd9yVaa6dzOcBnj6KwKqQCk0I
K9OLutqUmLfNKjoqxzo4zN2LA+EVi0RKui+QaSkyUSLoYHiZMIiOq403BrVu
hoiznENXGufBWwbZWVzLkHEIq4K4U22lxbnoue2dmnlmw8pKWSiqKE+QU+vh
0MRq3zqI1fV8MMYGNHpKC+GcDBgMBQ/7uhTTSKn3QjeYMjo6ixVOdp7vNKDY
+g2kyf1mteVfwbGFCoawU3sZ885EIqLbuY6sY3cAjb7Dx0RBoCU/O93WAwk3
9keuZUAhEnhu7QwqYyp3UyILXNf4oF5UTwQ8Ld30RYXnwZGDscSB7DoDArFb
tSdwsKL1X3UXMOBV9gB5k0L/iulr2itzL0OkBKiURXLjwjqjLxFj4HslJFco
wrZ9v8FZrPQ5TkZjXoZ5tsq3PXL+VFul4QzMR7TrRGQIVcn9Ty0LlakI+bdL
hI7nxX+JKdhaPp/aXnV2MGsRBCsGV8M1vrzO5r13Q+Hxsl5rd693REWGEB8Y
Y3X/iRfq/cJoDMJYtiKGdUFF6yH96xE5vSs=
=t9s9
-----END PGP SIGNATURE-----`;

        const { verificationStatus: verificationStatusSignedCard } = await verifySignedCard(
            signedCard,
            signatureSignedCard,
            verifyingKey
        );
        expect(verificationStatusSignedCard).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);

        /**
         * This legacy signature is verified in binary (despite the "\n" EOLs) because legacy Web would produce text signatures,
         * and verifyMessage is going to check the signature type and normalize the EOLs in the text before verifying.
         * So no fallback verification is needed in this case.
         */
        const { verificationStatus: verificationStatusBinarySigned } = await CryptoProxy.verifyMessage({
            binaryData: utf8StringToUint8Array(signedCard),
            verificationKeys: verifyingKey,
            armoredSignature: signatureSignedCard,
        });
        expect(verificationStatusBinarySigned).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);

        const encryptedAndSignedCard =
            '0sC0AVhc/TD0qVsq3nUgOiPnU4BGfbSI7U2RzjnxjUhokCEuq+Sn+XQKdR+F71keN6zUvgImIImJK8lngOiTqCW810VmLPwokvH3f7CiPsYT3v99HEgoskhv38nsxDmI1hQFAzEqanGSWkRWotwsW8gPdgK7v5Ps8Eb9qmhjnGoT4WVVahexiA5S3wHvmZczENJA3Mas419P+ff6XVt7Cx4lr24FSphjl/7U90eAePFbTEkjMKtMn2km4a2CP3nI1seaL9pWOPCca4Inn221nxFAugmvILxSn01ZQsM5OX38ZcAyeAsIi+UGDxHKqg9BBMtsLL1PVq79ayf9kQcXuZACrlVHcQ4rkz++1pRx8UbNBdN+B4OJPVNM2hRDSSo/8nkh8ztwcop4BEz+bmeupk6/YJnUbo+cO9Df4fi1DytjSQIaC7bQPuDBSCRtKYCfxlHyrhDoPS+T8dZmYfOUru1X5WCSMScXkreSTviF8VkBePJqRmrE';
        const sessionKey: SessionKey = {
            data: Uint8Array.fromBase64('5e08Opb7TvQL5adOSULm0OKlt/bOeCDQSxlw1fWnnxc='),
            algorithm: 'aes256',
        };
        const signatureEncryptedAndSignedCard = `-----BEGIN PGP SIGNATURE-----

wsFzBAABCAAnBYJkFGJSCZA3YC9dm9OaJhYhBJ74zuPAzq/weYpA/zdgL12b
05omAAA7AQ/7BMju7e4BCePMeCxz2Sa3C2QMUjA686E3u3NAlO7uLdcQXGGX
j4028qwQthcjE7Hm3gInA7rN3nbjxiXa55GLQI1yv4lyAWJQ3HzNSvz2Q/Vw
xLcT1KlZBcWg0HtXIz1PdS7cNMGk7RTG5DVLi5b5bfVmN4ES5nzBtAfTCrN4
IIdQZ0bCVLy6tBzdGkgwRiLs8IZ+iAYckCEYZdJUssfiNTpxvg3u0qIA4LMT
LrSBkRQTlx5XCcg9QK9aFDw2Conirda1+FqQyD9ftfU9zAqP6a3BVrGSkvpy
31lUlm7AEA4fw4sj8D00EOxVAQoINMsI7zpdmU9+LRYsmPJmaJk4x+4K1B2e
Y1/Wg/9isYkpnG4uHB3oZ1LWrPiqkPjAB7d7IARmgixbPyMGefrG2haL+LLF
5+TskldrGRFDdhvd8FZ2joddV0vkYUN2KRud/76EfGGbEacAczTKGw/hW+Na
adCXh6FC9A89sB+/5TJ6EvnsyZWDDArJiyidSc3DEfOWzxBaRxaCizeHgxPR
hLeAuC5ZJObnSLiYryactwNnR2iOS2Dk/Ej2B2swdC8/vD/NTEdSWVUxWWOn
+EiTdkNpeBbA23C0cHfBOA5kr4W4whVZYa+mfcV+dVc61Ea0fpXfmzWFut2E
uS98JFYRm7dxVWDkdLoOtCk6IC5vuDvapZ4=
=/dKU
-----END PGP SIGNATURE-----`;

        const { data, verificationStatus: verificationStatusEncryptedAndSignedCard } = await decryptCard(
            Uint8Array.fromBase64(encryptedAndSignedCard),
            signatureEncryptedAndSignedCard,
            verifyingKey,
            sessionKey
        );
        expect(data).toEqual(
            'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Proton AG//web-calendar 5.0.9.0//EN\r\nBEGIN:VEVENT\r\nUID:jMya8Q_DfmpSWN9MdRAvdncAmLY-@proton.me\r\nDTSTAMP:20230317T124114Z\r\nDESCRIPTION:Line\\njumps\\n\\nAnd a \\\\n\r\nSUMMARY:Australian Brandenburg Orchestra concert: Ottoman Baroque with the \r\n Whirling Dervishes\r\nEND:VEVENT\r\nEND:VCALENDAR'
        );
        expect(verificationStatusEncryptedAndSignedCard).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);

        // this legacy signature is verified in binary as expected since legacy Web signed encrypted cards in binary already. No need of fallback
        const { verificationStatus: verificationStatusBinaryEncrypted } = await CryptoProxy.decryptMessage({
            binaryMessage: Uint8Array.fromBase64(encryptedAndSignedCard),
            verificationKeys: verifyingKey,
            armoredSignature: signatureEncryptedAndSignedCard,
            sessionKeys: sessionKey,
        });
        expect(verificationStatusBinaryEncrypted).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });

    it('should verify RFC-compliant events with trailing spaces signed as text (legacy Android)', async () => {
        const signedCard =
            'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Proton AG//AndroidCalendar 2.7.1//EN\r\nBEGIN:VEVENT\r\nUID:wETnJu3LPvN66KXRDJMYFxmq77Ys@proton.me\r\nDTSTAMP:20230317T104052Z\r\nDTSTART;TZID=Europe/Zurich:20230317T120000\r\nDTEND;TZID=Europe/Zurich:20230317T123000\r\nSEQUENCE:0\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
        const signatureSignedCard = `-----BEGIN PGP SIGNATURE-----
Comment: https://gopenpgp.org
Version: GopenPGP 2.5.0

wsFzBAEBCgAnBQJkFEOkCZA3YC9dm9OaJhYhBJ74zuPAzq/weYpA/zdgL12b05om
AADq+w/+PrFHkLzgOUTdNvkDVEMT2N4Y3xxG//zuFiYNf8Zs7WPpR+4e+z9TFPZW
LD+zajPx5/CKwzozFZ02LGw3OeQUM9cnhxPdG7zA8JuqpxGnRt0ubzlLtnrmduj6
4yZvYZJa9zMattk8XtP8+TqRHyp4yheK+Ju+2jYNjtCQhPFydcMF1Ba5WBdYQJVl
sKOl4WkAmEjJJdD86vD2STqamjbe4E6TcNmusBjYJOrU3zQES5AxqNRLFjcmDA2o
9JcGomFIg+KBidWqYXy6TefgKllmWsfduDIyZxxmn8o22KA3oY0yVaFPybBwwsxI
z4SIZBwL4/vSwdhBW2nWHpXCcRt+HB1ncANpajiMQQCg8kWmRgFWrtz1ONordXih
T4y9DTbDiU2lQhXKOyuoIqhAyIe67xQNCz3KtSP0TAkjm3+ApNGY+PCnJZzrgmAX
gvrXnRdRPi7LBUEH22rSXMqMPuOX8Af4qshrpcOYQCLos4W6yXZkp5/tBXdf/csW
7kUBaxOxkB1IZwHF1wkerQa/OrSAjk75AwlFwkL3MVsGUXTKXYvJ5jw33KvMdzmr
koyFAGsS/RHa4+ZiqbCM+AikATf9iT7akYzTefQUGU3U5FhLj7FGLmQUhe8lPCNC
kUoztkcHA+E9tez5X7KdhUMMHPr7gnAlf10XGVGT/s8DaJ96lg0=
=SEFg
-----END PGP SIGNATURE-----`;

        const { verificationStatus: verificationStatusSignedCard } = await verifySignedCard(
            signedCard,
            signatureSignedCard,
            verifyingKey
        );
        expect(verificationStatusSignedCard).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);

        // this legacy signature is verified in binary without need of fallback
        const { verificationStatus: verificationStatusBinarySigned } = await CryptoProxy.verifyMessage({
            binaryData: utf8StringToUint8Array(signedCard),
            verificationKeys: verifyingKey,
            armoredSignature: signatureSignedCard,
        });
        expect(verificationStatusBinarySigned).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);
        expect(getNeedsLegacyVerification(verificationStatusBinarySigned, signatureSignedCard)).toEqual(false);

        const encryptedAndSignedCard =
            '0sC2AePHfQWired3Wj7qHXXSU/x4K1Det1Wtd57YiGK+H8Ed6t5NSPvjx9AOGHLRUuv93KPj1e2G/aZyPGzEEmT6HkXxR9q9PxBvwhWwu0mev5buiMpLqWPVC5ryNrnyLjqJjB+NwcUAs43uZsuYvR4xGNEVcu9UvWUKOoiYt5CWnOFnXnOZx//5/ZG+Xd8e2zwJOriJfu5eDkosIwFvr9hmI3mQahNGb64yqd7KQsIHJv29RhG5v7DluOK3rQMxdKZ3RxGpbbjIOjMLdB7Vuiku7snwmCHHVpaXKmNZOMv6VFdsHIKwtBf712++7o6tMzyGgBGc2rNgdGPCXEzSc892ZDxcrhX3JjcZhUOMGsCs7svr7RtETOXZXQFUnFWD58CpiGct5c0LN/5vcNYrMULqjGShtDHYTK3u4mDU6BFMrtT7gTHqYTEW7gpwNeM+d7GDMt2kHfTLgZQxOpRRsdgq3+2Bh4yGd8OskmwP81Y6p9twWDOZkrc=';
        const sessionKey: SessionKey = {
            data: Uint8Array.fromBase64('v0tbmWKoALXNhkphFy7lje3amf9WP8vSf8aUsSF9Wvs='),
            algorithm: 'aes256',
        };
        const signatureEncryptedAndSignedCard = `-----BEGIN PGP SIGNATURE-----
Version: GopenPGP 2.5.0
Comment: https://gopenpgp.org

wsFzBAEBCgAnBQJkFEpPCZA3YC9dm9OaJhYhBJ74zuPAzq/weYpA/zdgL12b05om
AADVsxAA4CtMT70V3z84yHhufsPh3HN4jonUk7riNtvwNdOlz6zmDlMoj6bf6vsz
GdVUHHXY/XnDD7zEI5W+SeTIkcA8/xl1YhIuZnr75SvZQ5f9TINUZj136NnfhCnc
E1/OcNgtBHvIaPYmFXGV7xKm3NZP1mS34DrOvDPetYoBo8haBTo2CXoMBAEnJRTH
mhcx2d3sXAY9ChWnZYdaG4bCh1riMM3aiu0WLFF2A1wegWz2webtsLsPSkt5SkhU
egm4e2j7mwmr3ZuinZcPOaca7v0Rw9UOfiV7e6Xsz0xL8tD9DdE6nv3RpARt74qT
UNpMwdG8bZCQKPtFT2kbzYWWph2wo+yKA5W4+HvJ3OeOJvZl0r8E+MGDf6iuvuzy
wyLZwltsP90OUHLCXP6IhgiVkOW6yRCDYyjLsp0DXYf+t/P465pGr/o6fgiJyf6O
3kFSh1RBptgsQOqX+XiP6v6H1NTr/z0W1C09IgHCvgVtPKxYTTcUCASkz0/9zrpc
TeEGwhP3Oc52onC9vYGiITjL7nY4OhEH7vO2gJudb9U6TuNlRgCfrFlATTAdE6GM
iPVLMhEAafXEHsXOYoiX3YbgHrPBBHBydcyRHQs8rv8RTCWHmvF7m2PNSVAEJrr6
p6UwLlBEdbtqT8YixITK1QU+Owmk/GmWADOyVzN/hXKg0zJVTc0=
=Jg7J
-----END PGP SIGNATURE-----`;

        const { data, verificationStatus: verificationStatusEncryptedAndSignedCard } = await decryptCard(
            Uint8Array.fromBase64(encryptedAndSignedCard),
            signatureEncryptedAndSignedCard,
            verifyingKey,
            sessionKey
        );
        expect(data).toEqual(
            'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Proton AG//AndroidCalendar 2.7.1//EN\r\nBEGIN:VEVENT\r\nUID:wETnJu3LPvN66KXRDJMYFxmq77Ys@proton.me\r\nDTSTAMP:20230317T104052Z\r\nDESCRIPTION:Line\\nJump\\n\\nAnd a \\\\n\r\nSUMMARY:Australian Brandenburg Orchestra concert: Ottoman Baroque with the \r\n Whirling Dervishes\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n'
        );
        expect(verificationStatusEncryptedAndSignedCard).toEqual(EVENT_VERIFICATION_STATUS.SUCCESSFUL);

        // this legacy signature is NOT verified in binary. It needs the fallback
        const { data: decryptedData, verificationStatus: verificationStatusBinaryEncrypted } = await CryptoProxy.decryptMessage({
            binaryMessage: Uint8Array.fromBase64(encryptedAndSignedCard),
            format: 'binary',
            verificationKeys: verifyingKey,
            armoredSignature: signatureEncryptedAndSignedCard,
            sessionKeys: sessionKey,
        });
        expect(verificationStatusBinaryEncrypted).toEqual(VERIFICATION_STATUS.SIGNED_AND_INVALID);
        expect(getNeedsLegacyVerification(verificationStatusBinaryEncrypted, uint8ArrayToUtf8String(decryptedData))).toEqual(true);
    });
});
