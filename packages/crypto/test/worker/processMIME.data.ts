export const key = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.4.6
Comment: https://openpgpjs.org

xjMEXG6rNhYJKwYBBAHaRw8BAQdA63eiHJ6ylmHXwDzvNoBXDx3UkaF6rm3d
kToIFs8KYGnNG0pvbiBTbWl0aCA8am9uQGV4YW1wbGUuY29tPsJ3BBAWCgAf
BQJcbqs2BgsJBwgDAgQVCAoCAxYCAQIZAQIbAwIeAQAKCRACmBrNmWu7s6ig
AP4l4JUNFYP1lzje4+VB1oz3xgAJwDpIPnpvV4p6fVfCMQEAsfqvA6OdgLl+
MmVRBRXO1BUtkSxwS9zxzQfE/0NZ7QfOOARcbqs2EgorBgEEAZdVAQUBAQdA
4IcImEOmtilzNy6BvjyoHHtiukYZlb4/38iqQbzQxywDAQgHwmEEGBYIAAkF
AlxuqzYCGwwACgkQApgazZlru7OCeAD/Waa1g7t1DsrE8Di+ovD19Xs7js4R
82uvdzLBXafN8okBALL5uHCjG/gkJzHGun2Tj2MKO2ykR6gv6lVKo7jX75kD
=7vY3
-----END PGP PUBLIC KEY BLOCK-----`;

export const multipartSignedMessage = `From: Jon Smith <jon@example.com>
To: Jon Smith <jon@example.com>
Mime-Version: 1.0
Content-Type: multipart/signed; boundary=bar; micalg=pgp-md5;
protocol="application/pgp-signature"

--bar
Content-Type: text/plain; charset=iso-8859-1
Content-Transfer-Encoding: quoted-printable

=A1Hola!

Did you know that talking to yourself is a sign of senility?

It's generally a good idea to encode lines that begin with
From=20because some mail transport agents will insert a greater-
than (>) sign, thus invalidating the signature.

Also, in some cases it might be desirable to encode any   =20
trailing whitespace that occurs on lines in order to ensure  =20
that the message signature is not invalidated when passing =20
a gateway that modifies such whitespace (like BITNET). =20

me   
--bar

Content-Type: application/pgp-signature

-----BEGIN PGP SIGNATURE-----
Version: OpenPGP.js v4.4.6
Comment: https://openpgpjs.org

wl4EARYKAAYFAlxurnwACgkQApgazZlru7OZ4gEA7gcIhNDZe9DurcA7I6Hb
J+mJL9vKtB5Ob4ponog5+ZYBAK6MCfmEImVCpdOlAIKmA9VRzQVLbW+Zm9cc
iwVC3WsC
=beyW
-----END PGP SIGNATURE-----

--bar--`;

export const multipartSignedMessageBody = `¡Hola!

Did you know that talking to yourself is a sign of senility?

It's generally a good idea to encode lines that begin with
From because some mail transport agents will insert a greater-
than (>) sign, thus invalidating the signature.

Also, in some cases it might be desirable to encode any    
trailing whitespace that occurs on lines in order to ensure   
that the message signature is not invalidated when passing  
a gateway that modifies such whitespace (like BITNET).  

me`;

// Message from: https://docs.microsoft.com/en-us/previous-versions/office/developer/exchange-server-2010/aa563375(v=exchg.140)
export const multipartMessageWithAttachment = `From: Some One <someone@example.com>
To: "Someone Else" <someone-else@example.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="XXXXboundary text"

This is a multipart message in MIME format.

--XXXXboundary text
Content-Type: text/plain

this is the body text

--XXXXboundary text
Content-Type: text/plain;
Content-Disposition: attachment; filename="test.txt"

this is the attachment text

--XXXXboundary text--`;

export const messageWithEmptySignature = `Content-Type: multipart/signed; protocol="application/pgp-signature";\n micalg="pgp-sha256"; boundary="===============9034558267015095129=="
MIME-Version: 1.0

--===============9034558267015095129==
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="--==_mimepart_64c6b73c4dd6d_2292b028ca3c6b8191503f"; charset=UTF-8
Content-Transfer-Encoding: 7bit

This is a multi-part message in MIME format.
----==_mimepart_64c6b73c4dd6d_2292b028ca3c6b8191503f
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: quoted-printable

Hello

----==_mimepart_64c6b73c4dd6d_2292b028ca3c6b8191503f
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: quoted-printable

<div>Hello</div>

----==_mimepart_64c6b73c4dd6d_2292b028ca3c6b8191503f--

--===============9034558267015095129==
Content-Type: application/pgp-signature; name="signature.asc"
MIME-Version: 1.0
Content-Disposition: attachment; filename="signature.asc"


--===============9034558267015095129==--
`;
