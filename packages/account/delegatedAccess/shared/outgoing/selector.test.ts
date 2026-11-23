import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { User } from '@proton/shared/lib/interfaces/User';

import { selectEnrichedOutgoingDelegatedAccess } from './selector';

const user = { Keys: [{ ID: 'key' }], Private: 1, Type: 1, isPaid: true, canPay: true } as unknown as User;

const getResult = (isOutgoingSupported: boolean) => {
    return selectEnrichedOutgoingDelegatedAccess.resultFunc(
        { value: user } as any,
        getInitialModelState() as any,
        {},
        { value: undefined } as any,
        isOutgoingSupported
    );
};

describe('selectEnrichedOutgoingDelegatedAccess', () => {
    it('is available when the outgoing flag is supported', () => {
        expect(getResult(true).isAvailable).toBe(true);
    });

    it('is not available when the outgoing flag is not supported', () => {
        expect(getResult(false).isAvailable).toBe(false);
    });
});
