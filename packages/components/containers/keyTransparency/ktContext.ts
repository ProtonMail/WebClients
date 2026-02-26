import { defaultKeyTransparencyState } from '@proton/key-transparency/shared';
import type { KeyTransparencyState } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

export interface KTContext {
    ktActivation: KeyTransparencyActivation;
    ktState: KeyTransparencyState;
}

export const defaultKTContext: KTContext = {
    ktActivation: KeyTransparencyActivation.DISABLED,
    ktState: defaultKeyTransparencyState,
};
