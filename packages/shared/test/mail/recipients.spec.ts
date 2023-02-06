import { Recipient } from '@proton/shared/lib/interfaces';
import {
    findRecipientsWithSpaceSeparator,
    inputToRecipient,
    recipientToInput,
} from '@proton/shared/lib/mail/recipient';

const address1 = 'address1@pm.me';
const address2 = 'address2@pm.me';

const addessName = 'Address';

describe('inputToRecipient', () => {
    it('should return a recipient with the email as the name and address if the input is an email', () => {
        const input = 'panda@proton.me';
        const result = inputToRecipient(input);
        expect(result).toEqual({ Name: input, Address: input });
    });

    it('should extract the email address surrounded by brackets', () => {
        const input = '<domain@debye.proton.black>';
        const result = inputToRecipient(input);
        expect(result).toEqual({ Name: '', Address: 'domain@debye.proton.black' });
    });

    it('should extract name and email address', () => {
        const input = 'Panda <panda@proton.me>';
        const result = inputToRecipient(input);
        expect(result).toEqual({ Name: 'Panda', Address: 'panda@proton.me' });
    });
});

describe('findRecipientsWithSpaceSeparator', () => {
    it('should detect recipients with space separator', () => {
        const input = `${address1} ${address2}`;
        const result = findRecipientsWithSpaceSeparator(input);

        expect(result).toEqual([address1, address2]);
    });

    it('should not detect recipients with space separator', () => {
        const input1 = `${address1}, ${address2}`;
        const input2 = `Address1 <${address1}>, Address2 <${address2}></address2>`;

        expect(findRecipientsWithSpaceSeparator(input1)).toEqual([]);
        expect(findRecipientsWithSpaceSeparator(input2)).toEqual([]);
    });
});

describe('recipientToInput', () => {
    it('should return the expected input', () => {
        const recipient1 = {
            Name: addessName,
            Address: address1,
        } as Recipient;
        const recipient2 = {
            Name: address1,
            Address: address1,
        } as Recipient;

        const expected1 = `${addessName} <${address1}>`;
        const expected2 = address1;

        expect(recipientToInput(recipient1)).toEqual(expected1);
        expect(recipientToInput(recipient2)).toEqual(expected2);
    });
});
