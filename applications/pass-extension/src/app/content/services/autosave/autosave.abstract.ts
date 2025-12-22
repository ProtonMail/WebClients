import type { Maybe } from '@proton/pass/types/utils/index';
import type { AutosaveFormEntry } from '@proton/pass/types/worker/form';

export interface AutosaveService {
    destroy: () => void;
    prompt: (submission: AutosaveFormEntry) => boolean;
    reconciliate: () => Maybe<Promise<boolean>>;
}
