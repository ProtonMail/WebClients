import { protonizer } from '@proton/shared/lib/sanitize';

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

        const decodedBody = decodeURIComponent(protonizer(messageBody, true).innerHTML);

        expect(removeLineBreaks(decryption?.decryptedBody || '')).toEqual(removeLineBreaks(decodedBody));
    });

    it('should detect all fields in a mailto string', () => {
        const mailto = `mailto:${address1}?subject=${subject}&cc=${address2},${address3}&bcc=${address4}&body=${body}`;

        const { data, decryption } = mailtoParser(mailto);
        const decodedBody = decodeURIComponent(protonizer(body, true).innerHTML);

        expect(data?.ToList).toEqual([{ Name: address1, Address: address1 }]);
        expect(data?.Subject).toEqual(subject);
        expect(data?.CCList).toEqual([
            { Name: address2, Address: address2 },
            { Name: address3, Address: address3 },
        ]);
        expect(data?.BCCList).toEqual([{ Name: address4, Address: address4 }]);
        expect(removeLineBreaks(decryption?.decryptedBody || '')).toEqual(removeLineBreaks(decodedBody));
    });
});
