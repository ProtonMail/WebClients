import type { KeyTransparencyState } from '@proton/key-transparency/interfaces';
import { defaultKeyTransparencyState } from '@proton/key-transparency/shared/defaults';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';

export interface KTContext {
    ktActivation: KeyTransparencyActivation;
    ktState: KeyTransparencyState;
}

export const defaultKTContext: KTContext = {
    ktActivation: KeyTransparencyActivation.DISABLED,
    ktState: defaultKeyTransparencyState,
};
