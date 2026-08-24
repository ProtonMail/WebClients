import type { Store } from 'redux';

import chunk from '@proton/utils/chunk';

import { compromisedPasswordsSync } from '../../store/actions';
import {
    selectCompromisedPasswordsCache,
    selectFeatureFlag,
    selectLastSyncedChange,
    selectMonitoredLogins,
    selectPassPlan,
} from '../../store/selectors';
import type { State } from '../../store/types';
import type { ItemRevision, ShareId, UniqueItem } from '../../types';
import { PassFeature } from '../../types/api/features';
import { and, not, or } from '../../utils/fp/predicates';
import { seq } from '../../utils/fp/promises';
import { deobfuscate } from '../../utils/obfuscate/xor';
import { WASM_PROCEDURE_BATCH_SIZE } from '../core/constants';
import type { PassCoreProxy } from '../core/core.types';
import { hasDomain, hasOTP, hasPasskeys } from '../items/item.predicates';
import { getItemKey, intoSelectedItem } from '../items/item.utils';
import { getAutofillUrls } from '../urls/utils/autofill';
import { isPaidPlan } from '../user/user.predicates';
import { checkPasswordCompromised, getLastChangeTimestamp } from './compromised-password.request';
import type { CompromisedPasswordEntry } from './types';

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
            if (!selectFeatureFlag(PassFeature.Pass__V1_40__CompromisedPasswords)(store.getState())) return [];
            if (!isPaidPlan(selectPassPlan(store.getState()))) return [];

            const logins = getLoginItems(options?.shareIds);
            const candidates = logins.filter((item) => item.data.content.password.v.length);

            const cache = selectCompromisedPasswordsCache(store.getState());
            const lastSyncedChange = selectLastSyncedChange(store.getState());
            const currentChange = await getLastChangeTimestamp().catch(() => undefined);

            const isFresh = (item: ItemRevision) => cache[getItemKey(item)]?.revision === item.revision;

            if (currentChange !== undefined && currentChange === lastSyncedChange && candidates.every(isFresh)) {
                return candidates.filter((item) => cache[getItemKey(item)]?.compromised).map(intoSelectedItem);
            }

            const groups = new Map<string, ItemRevision[]>();
            for (const item of candidates) {
                const password = deobfuscate(item.data.content.password);
                const group = groups.get(password) ?? [];
                group.push(item);
                groups.set(password, group);
            }

            const entries = Array.from(groups.entries());

            const groupResults = await seq(entries, async ([password, [primary]]) => {
                const prior = isFresh(primary) ? cache[getItemKey(primary)] : undefined;

                if (prior?.compromised) return prior;

                const check = await checkPasswordCompromised(password, prior?.etag);
                if (check.status === 'not-modified' && prior) return prior;
                return {
                    compromised: check.status === 'checked' ? check.compromised : false,
                    etag: check.status === 'checked' ? check.etag : '',
                    checkedAt: Date.now(),
                } satisfies Omit<CompromisedPasswordEntry, 'revision'>;
            });

            const results = entries.flatMap(([, items], idx) =>
                items.map((item) => ({ item, entry: { ...groupResults[idx], revision: item.revision } }))
            );

            /** Full re-check, so this is authoritative
             *  replaces the whole local cache rather */
            store.dispatch(compromisedPasswordsSync({ lastSyncedChange: currentChange ?? lastSyncedChange, results }));

            return results.filter(({ entry }) => entry.compromised).map(({ item }) => intoSelectedItem(item));
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
