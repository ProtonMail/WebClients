import { MutableRefObject } from 'react';

import { KeyTransparencyState, VerifyOutboundPublicKeys } from '@proton/shared/lib/interfaces';
import { defaultKeyTransparencyState } from '@proton/shared/lib/keyTransparency';

export interface KTContext {
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    getKTState: () => MutableRefObject<KeyTransparencyState>;
}

export const defaultKTContext: KTContext = {
    verifyOutboundPublicKeys: async () => {},
    getKTState: () => ({ current: defaultKeyTransparencyState }),
};
