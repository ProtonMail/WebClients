import type { Store } from 'redux';

import type { PassCoreProxy } from '@proton/pass/lib/core/types';
import { hasDomain, hasOTP } from '@proton/pass/lib/items/item.predicates';
import { intoSelectedItem } from '@proton/pass/lib/items/item.utils';
import { selectMonitoredLogins } from '@proton/pass/store/selectors';
import { type UniqueItem } from '@proton/pass/types';
import { and, invert } from '@proton/pass/utils/fp/predicates';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export interface MonitorService {
    checkMissing2FAs: () => Promise<UniqueItem[]>;
    checkWeakPasswords: () => Promise<UniqueItem[]>;
}

/** MonitorService provides `PassMonitor` methods that rely
 * on the `PassRustCore` module */
export const createMonitorService = (core: PassCoreProxy, store: Store): MonitorService => {
    const getLoginItems = () => selectMonitoredLogins(store.getState());

    const service: MonitorService = {
        checkMissing2FAs: async () => {
            const logins = getLoginItems();
            const candidates = logins.filter(and(hasDomain, invert(hasOTP)));
            const domains = candidates.flatMap((item) => item.data.content.urls);
            const eligible = await core.twofa_domains_eligible(domains);
            const eligibleDomain = (url: string) => eligible.get(url) === true;

            return candidates.filter((item) => item.data.content.urls.some(eligibleDomain)).map(intoSelectedItem);
        },

        checkWeakPasswords: async () => {
            const logins = getLoginItems();
            const candidates = logins.filter((item) => item.data.content.password.v);
            const passwords = candidates.map((item) => deobfuscate(item.data.content.password));
            const scores = await core.check_password_scores(passwords);

            return candidates.filter((_, idx) => scores[idx] !== 'Strong').map(intoSelectedItem);
        },
    };

    return service;
};
