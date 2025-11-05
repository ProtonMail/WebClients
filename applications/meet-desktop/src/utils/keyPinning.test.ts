import { Request } from "electron";
import { verifyDownloadCertificate, VerificationResult } from "./keyPinning";

jest.mock("electron", () => ({
    app: { isPackaged: true },
}));

const CERTIFICATE_DATA_rsa4096_badssl_com = `-----BEGIN CERTIFICATE-----
MIIF8TCCBNmgAwIBAgISA/X7F7ww9TqyWle5qFeJa4fqMA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yNDA1MTUxNjIwMzBaFw0yNDA4MTMxNjIwMjlaMBcxFTATBgNVBAMM
DCouYmFkc3NsLmNvbTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAL/i
CrZTPVt2qXKDf0YSv63FyAIhlzZMhdNyl1cnE74gHoTXXg7BIMLrbrhHXWgQ3QQL
jkfdBC6h4O9xIOGxp/lsLVWqZ5G5F7hbsqXklYi8rkUmJJ17gl1uRPr0fSVreUj5
FXjBC9bR77u7+jBQevuXCc8aOFav8rG/9cMb4ZJ9TPD5gnHj7bDD7oleTJeLGwmZ
gCPGhhOE+Q8REsX7Hlug6ByIvhXlt+zQzyPb2fyO3OF6jjLMaeZI0yiYQ2FPNlwh
I1HqqVnnZNfszc1EVILCKt+PqNAkSDXNRJcqdfbqg6NrnMUf/vA+BfLLOxDH7u1U
HySW61uQb25HPFA/iwwkr2tPGN68cUaa+KwYUIGNpkQCKqzzipvOv5rIfYEjENLG
RYLlXuia1bvCfsPAKNlvJfz21vFspRzo4H8ZQxisDH9TTuunCFgJ74rISBP64DBM
xpq5s/hjLR8WyoIvoowOPESBRB+ucOZ3F9VDyrQOCJsNjA4vikAlowJkIgNQ6B+y
euH0fEm3abMM9xmHS4w5Svncwutdp4PlAyjBGNUYJvPTKHHi7KpasYssLz6anT0n
gd71BqWjAH/Qs1GY3gBZQ+5cA789EqGOOZBqME1KDNnuLPn4ilzy9yU4Agqwi1w3
ucre5+GeHLHvRSPlA7DIz/IzFoIZZE3ZS2vTcXTNAgMBAAGjggIaMIICFjAOBgNV
HQ8BAf8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMAwGA1Ud
EwEB/wQCMAAwHQYDVR0OBBYEFEdHzvMOm+4+S3yYoMynQVEZX94pMB8GA1UdIwQY
MBaAFBQusxe3WFbLrlAJQOYfr52LFMLGMFUGCCsGAQUFBwEBBEkwRzAhBggrBgEF
BQcwAYYVaHR0cDovL3IzLm8ubGVuY3Iub3JnMCIGCCsGAQUFBzAChhZodHRwOi8v
cjMuaS5sZW5jci5vcmcvMCMGA1UdEQQcMBqCDCouYmFkc3NsLmNvbYIKYmFkc3Ns
LmNvbTATBgNVHSAEDDAKMAgGBmeBDAECATCCAQQGCisGAQQB1nkCBAIEgfUEgfIA
8AB2AD8XS0/XIkdYlB1lHIS+DRLtkDd/H4Vq68G/KIXs+GRuAAABj31FFuEAAAQD
AEcwRQIgTFJC8xeJGdCNkhD1bYJHybTkBuHW/ZAbFlWI4oIgZE8CIQC89WTTuHwh
g1Zo7wu1RNImu4ghqjUJBWbknyP1LTybHAB2ABmYEHEJ8NZSLjCA0p4/ZLuDbijM
+Q9Sju7fzko/FrTKAAABj31FFv4AAAQDAEcwRQIgDCyXtHTAkilrUU+0J3PC1o10
Z0sTXj4qwufPEAsMXpECIQCwH5z9Lxx7yyTLLEuACQ9vmvbS+jX2JTYF6qgOA6wA
fzANBgkqhkiG9w0BAQsFAAOCAQEAYxC1nOVo6k6AHnF5hHgp5iHAOb66CwdCwAJZ
DnCXT4Z1HmPGV/D4d6pRojJonqqqIt95kAkHS+oknbrHZKI0PhaOUhx1MRwrDL8j
f7k+57L0j1WAkILH0Q3DbsiH7VldgFwJKQIMG24Me8CLyfbiEJ2tpr/lgu8dmogS
By62iquBYsmPvfQsZeRSmw0ZcYRN/KP2qN7VXthT0CImUOTnXwkFHgJeDM+0Tbnk
RyQ73Y4F0uqo2WtMleY9rhVvYq6OV2kpHhgxj/K82nWPr1s+lNmwM+EY2pWtmBch
yeM/BP0fYM2D6GLEOsw0DOVqaYvu/lfiQKxXbT5aVLkeV/6E5w==
-----END CERTIFICATE-----`;

const CERTIFICATE_DATA_proton_me = `-----BEGIN CERTIFICATE-----
MIIGEDCCBPigAwIBAgISA9ufFVqr6Ms6PCjdUiOxKqaNMA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yNDA1MTQwOTE5NTlaFw0yNDA4MTIwOTE5NThaMBQxEjAQBgNVBAMT
CXByb3Rvbi5tZTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMZ7SzGC
+s4TYcGSQiadJmqgXiHVHD0kz4+GmP3J5Zj51tiZIf7b5MiGTXfGXfwiWduImURe
9giY3gNAM0/LOELGWmpFB7kVm/NjXP40xPj93SrjDjF+nDdP5ninduJDEON0RQ5j
US1ZH8R+cEzmMdD7a4qN03zz2r12mzcYs/D6OQEg0c86v4iicKMBRXS/bHcIUR6u
ouFy411QpwZVvn/3BtbD2oaRcO4AtOBeOC/POnwmSi3ImiyLXakjlEmRe4taWw1+
74WUUkhuOje3aOEr0yDVHEbkaPx+mmw5XZwJkGXScVnieD/fXBcH1cZyzZKYuew2
LllJN3MCyM0lIDypdT5MY89YzLhUe8B2T4Huw26gIYUWv6aTlRRl6ArdHD7zVkf2
hOCWtYGcCBLfKjSNQ/MzeKcHwb6/A6qqfyoaBCXrSVA/1X9qvkinEOgfYJ5tiBFy
GWNNsx1EEJml4onApxfO68XBptN4fGFPVD2RC1nazwwztyuUapGkBAQxB3rIKVzw
j+XOxTV3d0xxPM/jOvGeIUewXhSC7PmpF/qFR1rlBkOhdL//uAbpqaZi3kUm9UQN
M8OofZOqPwRSLhqt3GEYL84s451zuwy47fLBRna8TtAb4hf5yifnrFlKow2kV+Vd
qTdq9H7/85N83IVp1twO8tZEzRtEij1GsobtAgMBAAGjggI8MIICODAOBgNVHQ8B
Af8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMAwGA1UdEwEB
/wQCMAAwHQYDVR0OBBYEFESfwooppIjMpfth5onRvnFZZL6BMB8GA1UdIwQYMBaA
FBQusxe3WFbLrlAJQOYfr52LFMLGMFUGCCsGAQUFBwEBBEkwRzAhBggrBgEFBQcw
AYYVaHR0cDovL3IzLm8ubGVuY3Iub3JnMCIGCCsGAQUFBzAChhZodHRwOi8vcjMu
aS5sZW5jci5vcmcvMEYGA1UdEQQ/MD2CByoucHIudG6CCyoucHJvdG9uLm1lghMq
LnN0b3JhZ2UucHJvdG9uLm1lggVwci50boIJcHJvdG9uLm1lMBMGA1UdIAQMMAow
CAYGZ4EMAQIBMIIBAwYKKwYBBAHWeQIEAgSB9ASB8QDvAHYAPxdLT9ciR1iUHWUc
hL4NEu2QN38fhWrrwb8ohez4ZG4AAAGPdp27JAAABAMARzBFAiAr50htn1cXiX1r
ckqePfE5//xRSOz1ORNUk5eJDNKTNQIhAI1Rb0Urv+KdQqCbLhoToAKFhc4tStBD
uLmIKDdQdpZxAHUAGZgQcQnw1lIuMIDSnj9ku4NuKMz5D1KO7t/OSj8WtMoAAAGP
dp27MAAABAMARjBEAiABReb0nU3d9auHnMHraQoNvjQ6apmI37PfKEqGBfxx4wIg
adQ2DLGFg+Uq3EfEAUYGZLL5geVBJPmLwBiacbxFwCMwDQYJKoZIhvcNAQELBQAD
ggEBADFfWVNihexwH0y/cVbXof/1Nd1A+3PGuPcPHalb9UuGLXFhGxoEgOLz4tL3
EGRk0QhPwhw7JRTtvabRfGWG7htZ1RA7lcDQefhsuGro/awsit9Y2+eYWBoKnsT3
UVOai65XQ7jJObgvGjqhP6/r5AD/OlM6+9R2WI6NQeUA0cFL3FShOgbp0NlJFMN5
c6yxZLSsM79/M9sjkGyBU2YAVLlRIDNT6TZCij4oCOlxB5Nxt8PXqVeRrK9GKX1Y
qRcaspRhOlExxuEqTKgtlWCv2CZz/QZP8+Y7SGdPCjGZsmnByHV1ICz0XX9jJruf
xUysZKNxowc6dl5p9hAqU/Oo9ZM=
-----END CERTIFICATE-----`;

function test_verifyDownloadCertificate(hostname: string, certificateData: string, wantResult: VerificationResult) {
    const mockCallback = jest.fn();
    const r = {
        hostname,
        validatedCertificate: {
            data: certificateData,
        },
    } as Request;

    verifyDownloadCertificate(r, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(wantResult);
}

describe("key pinning", () => {
    test("verifyDownloadCertificate is accepted from proton.me", () => {
        test_verifyDownloadCertificate("proton.me", CERTIFICATE_DATA_proton_me, VerificationResult.Accept);
    });

    test("verifyDownloadCertificate is rejected with wrong certificate from proton.me", () => {
        test_verifyDownloadCertificate("proton.me", CERTIFICATE_DATA_rsa4096_badssl_com, VerificationResult.Reject);
    });

    test("verifyDownloadCertificate is skipped for neverssl.com", () => {
        test_verifyDownloadCertificate("http://neverssl.com", "", VerificationResult.UseVerificationFromChromium);
    });

    test("verifyDownloadCertificate is skipped for expired.badssl.com", () => {
        test_verifyDownloadCertificate(
            "https://expired.badssl.com",
            CERTIFICATE_DATA_rsa4096_badssl_com,
            VerificationResult.UseVerificationFromChromium,
        );
    });
});
