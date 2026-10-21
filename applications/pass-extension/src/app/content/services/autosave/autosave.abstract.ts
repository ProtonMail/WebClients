import type { Maybe } from '@proton/pass/types/utils';
import type { AutosaveFormEntry } from '@proton/pass/types/worker/form';

export interface AutosaveService {
    destroy: () => void;
    prompt: (submission: AutosaveFormEntry) => boolean;
    reconciliate: () => Maybe<Promise<boolean>>;
}
