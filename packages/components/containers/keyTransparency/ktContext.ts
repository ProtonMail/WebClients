import {
    KeyTransparencyActivation,
    KeyTransparencyState,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import { defaultKeyTransparencyState } from '@proton/shared/lib/keyTransparency';

export interface KTContext {
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    ktActivation: KeyTransparencyActivation;
    ktState: KeyTransparencyState;
}

export const defaultKTContext: KTContext = {
    verifyOutboundPublicKeys: async () => {
        return {};
    },
    ktActivation: KeyTransparencyActivation.DISABLED,
    ktState: defaultKeyTransparencyState,
};
