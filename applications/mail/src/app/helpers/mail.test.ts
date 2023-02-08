import { combineHeaders, splitMail } from './mail';

describe('combineHeaders', () => {
    it('should combine headers', async () => {
        const baseHeader = `Return-Path: <address1@pm.me>
X-Original-To: address2@pm.me
Delivered-To: address1@pm.me
Content-Type: text/html
Date: Mon, 6 Feb 2023 16:47:37 +0100`;

        const extraHeaders = `Content-Type: multipart/mixed;boundary=---------------------something`;

        const expected = `Return-Path: <address1@pm.me>
X-Original-To: address2@pm.me
Delivered-To: address1@pm.me
Content-Type: multipart/mixed;boundary=---------------------something
Date: Mon, 6 Feb 2023 16:47:37 +0100`;

        const result = await combineHeaders(baseHeader, extraHeaders);
        expect(result).toEqual(expected);
    });
});

describe('splitMail', () => {
    it('should split the mail into header and body', function () {
        const mailHeaders = `Content-Type: multipart/mixed;boundary=---------------------something1`;
        const mailBody = `-----------------------something1
Content-Type: multipart/related;boundary=---------------------something2

-----------------------something2
Content-Type: text/html;charset=utf-8
Content-Transfer-Encoding: base64

messageContenthlYWQ+CgogICAgPG1ldGEgaHR0cC1lcXVpdj0iY29udGVudC10eXBlIiBjb250
ZW50PSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLTgiPgogIDwvaGVhZD4KICA8Ym9keT4KICAgIDxw
PjxhIGhyZWY9Im1haWx0bzpTbGFjawombHQ7ZWItVDAzRFA0QzRDLVU3VjRaRlFLQi1ibXVzNmxw
M3dzamVwajNzbjJ3dWt1ZHY2dUBzbGFjay1tYWlsLmNvbSZndDs/c3ViamVjdD1SZXBseQogICAg
ICAgIHRvIFZvam8gSWxpZXZza2kiPlJlcGx5PC9hPgogICAgICA8YSBocmVmPSJtYWlsdG86Uk9S
TwogICAgICAgICZsdDtyb3JvdGVzdDVAcHJvdG9ubWFpbC5jb20mZ3Q7P3N1YmplY3Q9UmVwbHkg
dG8gcm9ybyI+UmVwbHk8L2E+PC9wPgogIDwvYm9keT4KPC9odG1sPgo=
-----------------------something2--
-----------------------something1--`;

        const mailString = `${mailHeaders}

${mailBody}`;

        const { headers, body } = splitMail(mailString);

        expect(headers).toEqual(mailHeaders);
        expect(body).toEqual(mailBody);
    });
});
