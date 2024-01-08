import { PROTON_DOMAINS } from '@proton/shared/lib/constants';

import { isValidEmailAdressToRefer } from './helpers';

describe('Referral helpers', () => {
    const addresses: [string, boolean][] = [
        ['guillaume@protonmail.com', false],
        ['guillaume@pm.me', false],
        ['guillaume@protonmail.ch', false],
        ['guillaume@yahoo.fr', true],
        ['àaaaa@yahoo.fr', false],
    ];

    const protonDomains = new Set(PROTON_DOMAINS);

    describe('isValidEmailAddress', () => {
        it.each(addresses)('%s should be %p', (address, expectedResult) => {
            expect(isValidEmailAdressToRefer(protonDomains, address)).toBe(expectedResult);
        });
    });
});
