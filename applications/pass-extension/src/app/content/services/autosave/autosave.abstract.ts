import type { AutosaveFormEntry, Maybe } from '@proton/pass/types';

export interface AutosaveService {
    prompt: (submission: AutosaveFormEntry) => boolean;
    reconciliate: () => Maybe<Promise<boolean>>;
}
