import type { Store } from 'redux';

import chunk from '@proton/utils/chunk';

import { selectMonitoredLogins } from '../../store/selectors';
import type { State } from '../../store/types';
import type { ShareId, UniqueItem } from '../../types';
import { and, not, or } from '../../utils/fp/predicates';
import { seq } from '../../utils/fp/promises';
import { deobfuscate } from '../../utils/obfuscate/xor';
import { WASM_PROCEDURE_BATCH_SIZE } from '../core/constants';
import type { PassCoreProxy } from '../core/core.types';
import { hasDomain, hasOTP, hasPasskeys } from '../items/item.predicates';
import { intoSelectedItem } from '../items/item.utils';
import { getAutofillUrls } from '../urls/utils/autofill';

export type MonitorCheckOptions = {
    shareIds?: ShareId[];
};
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

            const domains = new Set(candidates.flatMap((item) => getAutofillUrls(item.data.content.autofillUrls)));
            const chunks = chunk(Array.from(domains), WASM_PROCEDURE_BATCH_SIZE);
            const results = await seq(chunks, core.twofa_domains_eligible);

            const eligible = new Map(results.flatMap((dic) => Array.from(dic.entries())));
            const eligibleDomain = (url: string) => eligible.get(url) === true;

            return candidates
                .filter((item) => getAutofillUrls(item.data.content.autofillUrls).some(eligibleDomain))
                .map(intoSelectedItem);
        },

        checkWeakPasswords: async (options) => {
            const logins = getLoginItems(options?.shareIds);
            const candidates = logins.filter((item) => item.data.content.password.v.length);
            const passwords = candidates.map((item) => deobfuscate(item.data.content.password));
            const chunks = chunk(passwords, WASM_PROCEDURE_BATCH_SIZE);
            const scores = (await seq(chunks, core.check_password_scores)).flat();

            return candidates.filter((_, idx) => scores[idx] !== 'Strong').map(intoSelectedItem);
        },
    };

    return service;
};
