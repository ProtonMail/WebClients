import { parseMail, combineHeaders, splitMail } from '../../../src/helpers/mail';

const BASE_HEADERS = `Return-Path: <test@gmail.com>
X-Original-To: testqa@protonmail.com
Delivered-To: testqa@protonmail.com
Received: from mail-pl0-f48.google.com (mail-pl0-f48.google.com [209.85.160.48]) (using
 TLSv1.2 with cipher ECDHE-RSA-AES128-GCM-SHA256 (128/128 bits)) (No client certificate
 requested) by mail12i.protonmail.ch (Postfix) with ESMTPS id 08DAE82C for
 <testqa@protonmail.com>; Tue,
  8 May 2018 20:22:37 +0000 (UTC)
Received: by mail-pl0-f48.google.com with SMTP id t22-v6so2882138plo.7
        for <testqa@protonmail.com>; Tue, 08 May 2018 13:22:36 -0700 (PDT)
Received: from MacBook-Pro-van-Test.local (c-73-162-35-209.hsd1.ca.comcast.net.
 [73.162.35.209])
        by smtp.gmail.com with ESMTPSA id m18-v6sm16420907pgu.67.2018.05.08.13.22.33
        for <testqa@protonmail.com>
        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);
        Tue, 08 May 2018 13:22:33 -0700 (PDT)
Authentication-Results: mail12i.protonmail.ch; dmarc=pass (p=none dis=none)
 header.from=gmail.com
Authentication-Results: mail12i.protonmail.ch; spf=pass smtp.mailfrom=test@gmail.com
Authentication-Results: mail12i.protonmail.ch; dkim=pass (2048-bit key)
 header.d=gmail.com header.i=@gmail.com header.b="VfvKiAui"
Dkim-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20161025;
        h=to:from:openpgp:autocrypt:message-id:date:user-agent:mime-version
         :subject;
        bh=2raiXn8A7Ctxpanrx7/uDqTB7KK+8NlSKv2poRNQhb0=;
        b=VfvKiAuinhQw97WaIawXIVWzAHVI4unW2HJpaRgmH8mnUSCLqHpYu5A/XJ3fZcRgiV
         MuqgQnGaHLkLnNZ42ejCb+R1zwTFn/qy3yhAxJlltnoDWP/oUU7YHWDoqPkdqR3o8X/y
         j6VvPvUcetxfVn6Kd67cYMrwGaUfsaUv5p9rmzyLQZx3nWNcr4hW7+Ys4JVks2jYo4L2
         jj6wTWQeDYOKU+mE6fyXa2pBumC0ATNxTyw6F7Q9I6mIJcyUcMgXd28RNmtvWYvr3B+T
         HQEbDvmijEPsc62FWTBreivL9rDV/I6H/KmBRevu1RmQdIKRBITcjtFORbs14Cr1pt0e
         lkLQ==
X-Google-Dkim-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20161025;
        h=x-gm-message-state:to:from:openpgp:autocrypt:message-id:date
         :user-agent:mime-version:subject;
        bh=2raiXn8A7Ctxpanrx7/uDqTB7KK+8NlSKv2poRNQhb0=;
        b=f7IV1qCpzyxbZJWhpBnSyZQAqVa/8ext/Q/tfPqAH4JtqV/ZWqIwpFU6juo4IWHKHR
         kjr+6Y4ztiP+EYQSLTNK8N/rvuUdHWwU7qGv0rigDSwYiaTshxO5Dpl4xHznydVE2CFL
         xwxx42LhM8mXSUAXARi8A6Odk0yISNIY0BDoD/fXr4h+nX0NMrrbn3GNH688xmKFyGsY
         gN19K5syrCKmekvup9CFL+3AW9WC1wTQM9sBGS88DVqkQ0PBv+aYOdiuFzwzZJzohudk
         +Eyv1/DLjeBKKkBKDwpOSY1XpoWTcrSsWK052mpiMHJ1b9B9T7gv6X93InuX3kugr33M
         gqFg==
X-Gm-Message-State: ALQs6tC44L7fsMDZ4JQnUtMyaf+weKKOrju4Qf9o1vhH+jryipYBoIIH
 g8HzhMUjiDlBMXCgZG9qhkunMYAC
X-Google-Smtp-Source: AB8JxZrY2z80y4IPRmO3uASkA+h9X1r+c2Ur84otpz3F0F9FlLInBIerHspLKYX2Ihrnz6U4ZNEveg==
X-Received: by 2002:a17:902:9a9:: with SMTP id 38-v6mr43435444pln.114.1525810955214;
        Tue, 08 May 2018 13:22:35 -0700 (PDT)
To: testqa@protonmail.com
From: test <test@gmail.com>
Openpgp: preference=signencrypt
Date: Tue, 8 May 2018 13:22:32 -0700
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:52.0) Gecko/20100101
 Thunderbird/52.7.0
Mime-Version: 1.0
Subject: Encrypted Message
Content-Type: multipart/mixed
X-Spam-Status: No, score=-1.1 required=4.0 tests=DKIM_SIGNED,DKIM_VALID,
 DKIM_VALID_AU,ENCRYPTED_MESSAGE,FREEMAIL_FROM,SPF_PASS,TVD_SPACE_RATIO autolearn=ham
 autolearn_force=no version=3.4.0
X-Spam-Checker-Version: SpamAssassin 3.4.0 (2014-02-07) on maili.protonmail.ch
X-Pm-Origin: external
X-Pm-Content-Encryption: end-to-end
X-Pm-Transfer-Encryption: TLSv1.2 with cipher ECDHE-RSA-AES128-GCM-SHA256 (128/128 bits)
`;

const COMBINED_HEADERS = `Return-Path: <test@gmail.com>
X-Original-To: testqa@protonmail.com
Delivered-To: testqa@protonmail.com
Received: from mail-pl0-f48.google.com (mail-pl0-f48.google.com [209.85.160.48]) (using
 TLSv1.2 with cipher ECDHE-RSA-AES128-GCM-SHA256 (128/128 bits)) (No client certificate
 requested) by mail12i.protonmail.ch (Postfix) with ESMTPS id 08DAE82C for
 <testqa@protonmail.com>; Tue,
  8 May 2018 20:22:37 +0000 (UTC)
Received: by mail-pl0-f48.google.com with SMTP id t22-v6so2882138plo.7
        for <testqa@protonmail.com>; Tue, 08 May 2018 13:22:36 -0700 (PDT)
Received: from MacBook-Pro-van-Test.local (c-73-162-35-209.hsd1.ca.comcast.net.
 [73.162.35.209])
        by smtp.gmail.com with ESMTPSA id m18-v6sm16420907pgu.67.2018.05.08.13.22.33
        for <testqa@protonmail.com>
        (version=TLS1_2 cipher=ECDHE-RSA-AES128-GCM-SHA256 bits=128/128);
        Tue, 08 May 2018 13:22:33 -0700 (PDT)
Authentication-Results: mail12i.protonmail.ch; dmarc=pass (p=none dis=none)
 header.from=gmail.com
Authentication-Results: mail12i.protonmail.ch; spf=pass smtp.mailfrom=test@gmail.com
Authentication-Results: mail12i.protonmail.ch; dkim=pass (2048-bit key)
 header.d=gmail.com header.i=@gmail.com header.b="VfvKiAui"
Dkim-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20161025;
        h=to:from:openpgp:autocrypt:message-id:date:user-agent:mime-version
         :subject;
        bh=2raiXn8A7Ctxpanrx7/uDqTB7KK+8NlSKv2poRNQhb0=;
        b=VfvKiAuinhQw97WaIawXIVWzAHVI4unW2HJpaRgmH8mnUSCLqHpYu5A/XJ3fZcRgiV
         MuqgQnGaHLkLnNZ42ejCb+R1zwTFn/qy3yhAxJlltnoDWP/oUU7YHWDoqPkdqR3o8X/y
         j6VvPvUcetxfVn6Kd67cYMrwGaUfsaUv5p9rmzyLQZx3nWNcr4hW7+Ys4JVks2jYo4L2
         jj6wTWQeDYOKU+mE6fyXa2pBumC0ATNxTyw6F7Q9I6mIJcyUcMgXd28RNmtvWYvr3B+T
         HQEbDvmijEPsc62FWTBreivL9rDV/I6H/KmBRevu1RmQdIKRBITcjtFORbs14Cr1pt0e
         lkLQ==
X-Google-Dkim-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20161025;
        h=x-gm-message-state:to:from:openpgp:autocrypt:message-id:date
         :user-agent:mime-version:subject;
        bh=2raiXn8A7Ctxpanrx7/uDqTB7KK+8NlSKv2poRNQhb0=;
        b=f7IV1qCpzyxbZJWhpBnSyZQAqVa/8ext/Q/tfPqAH4JtqV/ZWqIwpFU6juo4IWHKHR
         kjr+6Y4ztiP+EYQSLTNK8N/rvuUdHWwU7qGv0rigDSwYiaTshxO5Dpl4xHznydVE2CFL
         xwxx42LhM8mXSUAXARi8A6Odk0yISNIY0BDoD/fXr4h+nX0NMrrbn3GNH688xmKFyGsY
         gN19K5syrCKmekvup9CFL+3AW9WC1wTQM9sBGS88DVqkQ0PBv+aYOdiuFzwzZJzohudk
         +Eyv1/DLjeBKKkBKDwpOSY1XpoWTcrSsWK052mpiMHJ1b9B9T7gv6X93InuX3kugr33M
         gqFg==
X-Gm-Message-State: ALQs6tC44L7fsMDZ4JQnUtMyaf+weKKOrju4Qf9o1vhH+jryipYBoIIH
 g8HzhMUjiDlBMXCgZG9qhkunMYAC
X-Google-Smtp-Source: AB8JxZrY2z80y4IPRmO3uASkA+h9X1r+c2Ur84otpz3F0F9FlLInBIerHspLKYX2Ihrnz6U4ZNEveg==
X-Received: by 2002:a17:902:9a9:: with SMTP id 38-v6mr43435444pln.114.1525810955214;
        Tue, 08 May 2018 13:22:35 -0700 (PDT)
To: testqa@protonmail.com, john@smith.com
From: test <test@gmail.com>
Openpgp: preference=signencrypt
Date: Tue, 8 May 2018 13:22:32 -0700
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:52.0) Gecko/20100101
 Thunderbird/52.7.0
Mime-Version: 1.0
Subject: cleartext subject
Content-Type: multipart/mixed; boundary="W38OaLmUxRJ0yicrTCaH9TaSBBRo9TgoY"; protected-headers="v1"
X-Spam-Status: No, score=-1.1 required=4.0 tests=DKIM_SIGNED,DKIM_VALID,
 DKIM_VALID_AU,ENCRYPTED_MESSAGE,FREEMAIL_FROM,SPF_PASS,TVD_SPACE_RATIO autolearn=ham
 autolearn_force=no version=3.4.0
X-Spam-Checker-Version: SpamAssassin 3.4.0 (2014-02-07) on maili.protonmail.ch
X-Pm-Origin: external
X-Pm-Content-Encryption: end-to-end
X-Pm-Transfer-Encryption: TLSv1.2 with cipher ECDHE-RSA-AES128-GCM-SHA256 (128/128 bits)
Message-Id: <cb60dce8-686d-4f3e-ff69-ac226ef15727@gmail.com>
Another-Header: hallo
`;

const EXAMPLE_MIME = {
    header: `Content-Type: multipart/mixed; boundary="W38OaLmUxRJ0yicrTCaH9TaSBBRo9TgoY";
 protected-headers="v1"
from: test <test@gmail.com>
to: testqa@protonmail.com, john@smith.com
message-id: <cb60dce8-686d-4f3e-ff69-ac226ef15727@gmail.com>
Another-header: hallo
Subject: cleartext subject`,
    body: `--W38OaLmUxRJ0yicrTCaH9TaSBBRo9TgoY
Content-type: text/rfc822-headers; protected-headers="v1"
Content-Disposition: inline

From: test <test@gmail.com>
To: testqa@protonmail.com
Subject: dsafdsf

--W38OaLmUxRJ0yicrTCaH9TaSBBRo9TgoY
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable
Content-Language: nl

sdfdsaf



--W38OaLmUxRJ0yicrTCaH9TaSBBRo9TgoY--
`,
    separators: [ '\r\n\r\n', '\n\n' ]
};

describe('splitMail', () => {

    it('should split the headers from the Body', () => {
        EXAMPLE_MIME.separators.forEach((separator) => {
            const mime = EXAMPLE_MIME.header + separator + EXAMPLE_MIME.body;
            const { headers, body } = splitMail(mime);
            expect(headers).toBe(EXAMPLE_MIME.header);
            expect(body).toBe(EXAMPLE_MIME.body);
        });
    });

    it('If there is no body, it should return the input as headers', () => {
        const { headers, body } = splitMail(EXAMPLE_MIME.header);
        expect(headers).toBe(EXAMPLE_MIME.header);
        expect(body).toBe('');
    });
});

describe('combineHeaders', () => {

    it('should overwrite and add the mime headers to actual message headers', async () => {
        // normalize to \r\n to address editor settings
        const combined = await combineHeaders(BASE_HEADERS.replace('\n', '\r\n'), EXAMPLE_MIME.header);
        expect(combined.replace(/(\r\n|\r|\n)/g, '\r\n')).toBe(COMBINED_HEADERS.replace(/(\r\n|\r|\n)/g, '\r\n'));
    });

});

