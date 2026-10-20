import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { getBitcoinViaEmailAddresses } from './email';

describe('getBitcoinViaEmailAddresses', () => {
    it('should exclude group and handle addresses', () => {
        const addresses = [
            { ID: '1', Type: ADDRESS_TYPE.TYPE_ORIGINAL },
            { ID: '2', Type: ADDRESS_TYPE.TYPE_GROUP },
            { ID: '3', Type: ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN },
            { ID: '4', Type: ADDRESS_TYPE.TYPE_HANDLE },
        ] as Address[];

        expect(getBitcoinViaEmailAddresses(addresses).map(({ ID }) => ID)).toEqual(['1', '3']);
    });
});
