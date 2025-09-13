import type { Store } from 'redux';

import { WASM_PROCEDURE_BATCH_SIZE } from '@proton/pass/lib/core/constants';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import { hasDomain, hasOTP, hasPasskeys } from '@proton/pass/lib/items/item.predicates';
import { intoSelectedItem } from '@proton/pass/lib/items/item.utils';
import { selectMonitoredLogins } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ShareId, UniqueItem } from '@proton/pass/types';
import { and, not, or } from '@proton/pass/utils/fp/predicates';
import { seq } from '@proton/pass/utils/fp/promises';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import chunk from '@proton/utils/chunk';

export type MonitorCheckOptions = { shareIds?: ShareId[] };
export interface MonitorService {
    checkMissing2FAs: (options?: MonitorCheckOptions) => Promise<UniqueItem[]>;
    checkWeakPasswords: (options?: MonitorCheckOptions) => Promise<UniqueItem[]>;
}

/** MonitorService provides `PassMonitor` methods that rely
 * on the `PassRustCore` module */
export const createMonitorService = (core: PassCoreProxy, store: Store<State>): MonitorService => {
    const getLoginItems = (shareIds?: ShareId[]) => selectMonitoredLogins(shareIds)(store.getState());

    const service: MonitorService = {
        checkMissing2FAs: async (options) => {
            const logins = getLoginItems(options?.shareIds);
            /** Valid 2FAs : OTPs or Passkeys */
            const candidates = logins.filter(and(hasDomain, not(or(hasOTP, hasPasskeys))));

            const domains = new Set(candidates.flatMap((item) => item.data.content.urls));
            const chunks = chunk(Array.from(domains), WASM_PROCEDURE_BATCH_SIZE);
            const results = await seq(chunks, core.twofa_domains_eligible);

            const eligible = new Map(results.flatMap((dic) => Array.from(dic.entries())));
            const eligibleDomain = (url: string) => eligible.get(url) === true;

            return candidates.filter((item) => item.data.content.urls.some(eligibleDomain)).map(intoSelectedItem);
        },

        checkWeakPasswords: async (options) => {
            const logins = getLoginItems(options?.shareIds);
            const candidates = logins.filter((item) => item.data.content.password.v);
            const passwords = candidates.map((item) => deobfuscate(item.data.content.password));
            const chunks = chunk(passwords, WASM_PROCEDURE_BATCH_SIZE);
            const scores = (await seq(chunks, core.check_password_scores)).flat();

            return candidates.filter((_, idx) => scores[idx] !== 'Strong').map(intoSelectedItem);
        },
    };

    return service;
};
