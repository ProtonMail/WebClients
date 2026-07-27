import { protonizer } from '@proton/sanitize/purify';

import { removeLineBreaks } from './test/message';
import { mailtoParser, toAddresses } from './url';

const address1 = 'address1@pm.me';
const address2 = 'address2@pm.me';
const address3 = 'address3@pm.me';
const address4 = 'address4@pm.me';

const addressName1 = 'Address1';
const addressName2 = 'Address2';

const htmlEntity = '%C2%AD'; // Test when mailto contains HTML entity "&shy;"

const subject = 'Mail subject';
const body = 'Mail body';
const bodyWithImages = `<div>
    Body of the email
    <img src="imageUrl" style="width:auto;">
</div>`;

describe('toAddresses', () => {
    it('should split an addresses string to a list of recipients', function () {
        const inputString1 = `${address1}, ${address2}`;
        const inputString2 = `${addressName1} <${address1}>`;

        const expectedResult1 = [
            { Name: address1, Address: address1 },
            { Name: address2, Address: address2 },
        ];
        const expectedResult2 = [{ Name: addressName1, Address: address1 }];

        expect(toAddresses(inputString1)).toEqual(expectedResult1);
        expect(toAddresses(inputString2)).toEqual(expectedResult2);
    });
});

describe('mailtoParser', () => {
    it.each`
        toList                                                            | expectedToList
        ${address1}                                                       | ${[{ Name: address1, Address: address1 }]}
        ${`${address1},${address2}`}                                      | ${[{ Name: address1, Address: address1 }, { Name: address2, Address: address2 }]}
        ${`${addressName1} <${address1}>`}                                | ${[{ Name: addressName1, Address: address1 }]}
        ${`${addressName1} <${address1}>, ${addressName2} <${address2}>`} | ${[{ Name: addressName1, Address: address1 }, { Name: addressName2, Address: address2 }]}
        ${`address${htmlEntity}1@pm.me`}                                  | ${[{ Name: address1, Address: address1 }]}
    `('should detect the TO list in a mailto string with TO = $toList', ({ toList, expectedToList }) => {
        const mailto = `mailto:${toList}?subject=${subject}`;
        const { data } = mailtoParser(mailto);

        expect(data?.ToList).toEqual(expectedToList);
    });

    it.each`
        ccList                                                            | expectedCCList
        ${address1}                                                       | ${[{ Name: address1, Address: address1 }]}
        ${`${address1},${address2}`}                                      | ${[{ Name: address1, Address: address1 }, { Name: address2, Address: address2 }]}
        ${`${addressName1} <${address1}>`}                                | ${[{ Name: addressName1, Address: address1 }]}
        ${`${addressName1} <${address1}>, ${addressName2} <${address2}>`} | ${[{ Name: addressName1, Address: address1 }, { Name: addressName2, Address: address2 }]}
        ${`address${htmlEntity}1@pm.me`}                                  | ${[{ Name: address1, Address: address1 }]}
    `('should detect the CC list in a mailto string with CC = $ccList', ({ ccList, expectedCCList }) => {
        const mailto = `mailto:${address3}?subject=${subject}&cc=${ccList}`;
        const { data } = mailtoParser(mailto);

        expect(data?.CCList).toEqual(expectedCCList);
    });

    it.each`
        bccList                                                           | expectedBCCList
        ${address1}                                                       | ${[{ Name: address1, Address: address1 }]}
        ${`${address1},${address2}`}                                      | ${[{ Name: address1, Address: address1 }, { Name: address2, Address: address2 }]}
        ${`${addressName1} <${address1}>`}                                | ${[{ Name: addressName1, Address: address1 }]}
        ${`${addressName1} <${address1}>, ${addressName2} <${address2}>`} | ${[{ Name: addressName1, Address: address1 }, { Name: addressName2, Address: address2 }]}
        ${`address${htmlEntity}1@pm.me`}                                  | ${[{ Name: address1, Address: address1 }]}
    `('should detect the BCC list in a mailto string with BCC = $bccList', ({ bccList, expectedBCCList }) => {
        const mailto = `mailto:${address3}?subject=${subject}&bcc=${bccList}`;
        const { data } = mailtoParser(mailto);

        expect(data?.BCCList).toEqual(expectedBCCList);
    });

    it('should detect the subject in a mailto string', () => {
        const mailto = `mailto:${address1}?subject=${subject}`;
        const { data } = mailtoParser(mailto);

        expect(data?.Subject).toEqual(subject);
    });

    it.each`
        messageBody
        ${body}
        ${bodyWithImages}
    `('should detect the body in a mailto string with Subject = $messagebody', ({ messageBody }) => {
        const mailto = `mailto:${address1}?subject=${subject}&body=${messageBody}`;
        const { decryption } = mailtoParser(mailto);

        const expectedBody = protonizer(messageBody, true).innerHTML;

        expect(removeLineBreaks(decryption?.decryptedBody || '')).toEqual(removeLineBreaks(expectedBody));
    });

    it('should preserve %0A (LF) newlines in body as line breaks', () => {
        const mailto = `mailto:${address1}?subject=${subject}&body=Line%201%0ALine%202`;
        const { decryption } = mailtoParser(mailto);

        expect(decryption?.decryptedBody).toContain('Line 1');
        expect(decryption?.decryptedBody).toContain('Line 2');
        expect(decryption?.decryptedBody).toMatch(/Line 1.*<br\s*\/?>.*Line 2/s);
    });

    it('should preserve %0D%0A (CRLF) newlines in body as line breaks', () => {
        const mailto = `mailto:${address1}?subject=${subject}&body=Line%201%0D%0ALine%202`;
        const { decryption } = mailtoParser(mailto);

        expect(decryption?.decryptedBody).toContain('Line 1');
        expect(decryption?.decryptedBody).toContain('Line 2');
        expect(decryption?.decryptedBody).toMatch(/Line 1.*<br\s*\/?>.*Line 2/s);
    });

    it('should not convert literal backslash-n to line breaks (non-compliant)', () => {
        const mailto = `mailto:${address1}?subject=${subject}&body=Line%20one\\nLine%20two`;
        const { decryption } = mailtoParser(mailto);

        expect(decryption?.decryptedBody).toContain('Line one\\nLine two');
    });

    it('should preserve percent signs in subject', () => {
        const mailto = `mailto:test@example.com?subject=50%25%20off`;
        const { data } = mailtoParser(mailto);

        expect(data?.Subject).toEqual('50% off');
    });

    it('should preserve percent signs in body', () => {
        const mailto = `mailto:test@example.com?body=100%25%20done`;
        const { decryption } = mailtoParser(mailto);

        expect(decryption?.decryptedBody).toContain('100% done');
    });

    it('should preserve + signs in subject', () => {
        const mailto = `mailto:test@example.com?subject=1+1=2`;
        const { data } = mailtoParser(mailto);

        expect(data?.Subject).toEqual('1+1=2');
    });

    it('should preserve + signs in body', () => {
        const mailto = `mailto:test@example.com?body=1+1=2`;
        const { decryption } = mailtoParser(mailto);

        expect(decryption?.decryptedBody).toContain('1+1=2');
    });

    it('should ignore unknown mailto query parameters', () => {
        const mailto = `mailto:${address1}?foo=bar&unknown=value`;
        const { data, decryption } = mailtoParser(mailto);

        expect(data?.Subject).toBeUndefined();
        expect(data?.CCList).toBeUndefined();
        expect(data?.BCCList).toBeUndefined();
        expect(decryption?.decryptedBody).toBeUndefined();
    });

    it('should detect all fields in a mailto string', () => {
        const mailto = `mailto:${address1}?subject=${subject}&cc=${address2},${address3}&bcc=${address4}&body=${body}`;

        const { data, decryption } = mailtoParser(mailto);
        const expectedBody = protonizer(body, true).innerHTML;

        expect(data?.ToList).toEqual([{ Name: address1, Address: address1 }]);
        expect(data?.Subject).toEqual(subject);
        expect(data?.CCList).toEqual([
            { Name: address2, Address: address2 },
            { Name: address3, Address: address3 },
        ]);
        expect(data?.BCCList).toEqual([{ Name: address4, Address: address4 }]);
        expect(removeLineBreaks(decryption?.decryptedBody || '')).toEqual(removeLineBreaks(expectedBody));
    });

    it('should return an empty object for the non-mailto input: input', () => {
        expect(mailtoParser('input')).toEqual({});
    });
    it('should return an empty object for the non-mailto input: "\'\'"', () => {
        expect(mailtoParser('')).toEqual({});
    });
    it('should return an empty object for the non-mailto input: "https://proton.me"', () => {
        expect(mailtoParser('https://proton.me')).toEqual({});
    });
    it('should return an empty object for the non-mailto input: "test@proton.me"', () => {
        expect(mailtoParser('test@proton.me')).toEqual({});
    });
    it('should return an empty object for the non-mailto input: "tel:+41000000000"', () => {
        expect(mailtoParser('tel:+41000000000')).toEqual({});
    });

    it('should accept an uppercase MAILTO scheme', () => {
        const { data } = mailtoParser(`MAILTO:${address1}`);

        expect(data?.ToList).toEqual([{ Name: address1, Address: address1 }]);
    });

    it('should not set a ToList when the recipient is missing', () => {
        const { data } = mailtoParser(`mailto:?subject=${subject}`);

        expect(data?.ToList).toBeUndefined();
        expect(data?.Subject).toEqual(subject);
    });

    it('should preserve a + in the recipient alias instead of turning it into a space', () => {
        const alias = 'user+tag@proton.me';
        const { data } = mailtoParser(`mailto:${alias}`);

        expect(data?.ToList).toEqual([{ Name: alias, Address: alias }]);
    });

    it('should preserve a + in a cc/bcc alias instead of turning it into a space', () => {
        const ccAlias = 'cc+tag@proton.me';
        const bccAlias = 'bcc+tag@proton.me';
        const { data } = mailtoParser(`mailto:${address1}?cc=${ccAlias}&bcc=${bccAlias}`);

        expect(data?.CCList).toEqual([{ Name: ccAlias, Address: ccAlias }]);
        expect(data?.BCCList).toEqual([{ Name: bccAlias, Address: bccAlias }]);
    });

    it('should parse mailto parameter keys case-insensitively', () => {
        const { data } = mailtoParser(`mailto:${address1}?SUBJECT=${subject}`);

        expect(data?.Subject).toEqual(subject);
    });

    it('should not set the subject when the parameter value is empty', () => {
        const { data } = mailtoParser(`mailto:${address1}?subject=`);

        expect(data?.Subject).toBeUndefined();
    });

    it('should ignore a parameter that has no value assignment', () => {
        const { data } = mailtoParser(`mailto:${address1}?subject&cc=${address2}`);

        expect(data?.Subject).toBeUndefined();
        expect(data?.CCList).toEqual([{ Name: address2, Address: address2 }]);
    });

    it('should keep an encoded ampersand (%26) inside a single parameter', () => {
        const { data } = mailtoParser(`mailto:${address1}?subject=A%26B&cc=${address2}`);

        // The %26 must not split the subject into an extra param, and cc must still be parsed.
        expect(data?.Subject).toContain('B');
        expect(data?.CCList).toEqual([{ Name: address2, Address: address2 }]);
    });
});
