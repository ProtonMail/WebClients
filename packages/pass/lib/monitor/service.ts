import type { Store } from 'redux';

import { WASM_PROCEDURE_BATCH_SIZE } from '@proton/pass/lib/core/constants';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import { hasDomain, hasOTP, hasPasskeys } from '@proton/pass/lib/items/item.predicates';
import { intoSelectedItem } from '@proton/pass/lib/items/item.utils';
import { isPasswordCompromised } from '@proton/pass/lib/monitor/compromised-password.request';
import { getAutofillUrls } from '@proton/pass/lib/urls/utils/autofill';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { compromisedPasswordsSync } from '@proton/pass/store/actions';
import { selectMonitoredLogins, selectPassPlan } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ShareId, UniqueItem } from '@proton/pass/types';
import { and, not, or } from '@proton/pass/utils/fp/predicates';
import { seq } from '@proton/pass/utils/fp/promises';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import chunk from '@proton/utils/chunk';

export type MonitorCheckOptions = { shareIds?: ShareId[] };
export interface MonitorService {
    checkCompromisedPasswords: (options?: MonitorCheckOptions) => Promise<UniqueItem[]>;
    checkMissing2FAs: (options?: MonitorCheckOptions) => Promise<UniqueItem[]>;
    checkWeakPasswords: (options?: MonitorCheckOptions) => Promise<UniqueItem[]>;
}

/** MonitorService provides `PassMonitor` methods that rely
 * on the `PassRustCore` module */
export const createMonitorService = (core: PassCoreProxy, store: Store<State>): MonitorService => {
    const getLoginItems = (shareIds?: ShareId[]) => selectMonitoredLogins(shareIds)(store.getState());

    const service: MonitorService = {
        checkCompromisedPasswords: async (options) => {
            if (!isPaidPlan(selectPassPlan(store.getState()))) return [];

            const logins = getLoginItems(options?.shareIds);
            const candidates = logins.filter((item) => item.data.content.password.v.length);
            const passwords = candidates.map((item) => deobfuscate(item.data.content.password));
            const results = await seq(passwords, isPasswordCompromised);
            const compromised = candidates.filter((_, idx) => results[idx]).map(intoSelectedItem);

            /** Full re-check, so this is authoritative
             * replaces the whole local cache */
            store.dispatch(compromisedPasswordsSync(compromised));

            return compromised;
        },

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
