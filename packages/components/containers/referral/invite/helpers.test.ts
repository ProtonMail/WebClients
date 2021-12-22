import { isValidEmailAdressToRefer } from './helpers';

describe('Referral helpers', () => {
    const addresses: [string, boolean][] = [
        ['guillaume@protonmail.com', false],
        ['guillaume@pm.me', false],
        ['guillaume@protonmail.ch', false],
        ['guillaume@yahoo.fr', true],
        ['àaaaa@yahoo.fr', false],
    ];

    describe('isValidEmailAddress', () => {
        it.each(addresses)('%s should be %p', (address, expectedResult) => {
            expect(isValidEmailAdressToRefer(address)).toBe(expectedResult);
        });
    });
});
