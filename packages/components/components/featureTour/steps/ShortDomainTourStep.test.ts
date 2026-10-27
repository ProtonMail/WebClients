import { buildAddress } from '@proton/account/testing/buildAddress';
import type { SharedStore } from '@proton/redux-shared-store/sharedStore';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { buildUser } from '@proton/shared/testing/buildUser';

import { shouldDisplayShortDomainTourStep } from './ShortDomainTourStep';

jest.mock('@proton/account/addresses', () => ({
    ...jest.requireActual('@proton/account/addresses'),
    addressesThunk: jest.fn(() => 'addresses'),
}));
jest.mock('@proton/account/user', () => ({
    ...jest.requireActual('@proton/account/user'),
    userThunk: jest.fn(() => 'user'),
}));

const buildDispatch = ({ hasPaidMail, addresses }: { hasPaidMail: boolean; addresses: Address[] }) => {
    const values: Record<string, unknown> = {
        user: buildUser({ hasPaidMail }),
        addresses,
    };
    return jest.fn((action: string) => Promise.resolve(values[action])) as unknown as SharedStore['dispatch'];
};

describe('shouldDisplayShortDomainTourStep', () => {
    it.each([
        { name: 'a user without paid Mail', hasPaidMail: false, addresses: [buildAddress()], expected: false },
        { name: 'a paid or trial Mail user', hasPaidMail: true, addresses: [buildAddress()], expected: true },
        { name: 'a paid Mail user without addresses', hasPaidMail: true, addresses: [], expected: false },
    ] as const)('returns canDisplay $expected for $name', async ({ hasPaidMail, addresses, expected }) => {
        const result = await shouldDisplayShortDomainTourStep(
            buildDispatch({ hasPaidMail, addresses: [...addresses] })
        );

        expect(result.canDisplay).toBe(expected);
    });

    it('does not read subscriptions', async () => {
        const dispatch = buildDispatch({ hasPaidMail: true, addresses: [buildAddress()] });

        await shouldDisplayShortDomainTourStep(dispatch);

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith('user');
        expect(dispatch).toHaveBeenCalledWith('addresses');
    });
});
