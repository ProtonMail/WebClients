import type { WasmPasswordScoreResult } from '@protontech/pass-rust-core';
import type { Store } from 'redux';

import type { PassCoreService } from '@proton/pass/lib/core/types';
import { isHealthCheckSkipped } from '@proton/pass/lib/items/item.predicates';
import { selectLoginItems } from '@proton/pass/store/selectors';
import { type UniqueItem } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export interface MonitorService {
    analyzePassword: (password: string) => Promise<WasmPasswordScoreResult>;
    checkMissing2FAs: () => Promise<UniqueItem[]>;
    checkWeakPasswords: () => Promise<UniqueItem[]>;
}

/** MonitorService provides `PassMonitor` methods that rely
 * on the `PassRustCore` module */
export const createMonitorService = (core: PassCoreService, store: Store): MonitorService => {
    const getLoginItems = () => selectLoginItems(store.getState());

    const service: MonitorService = {
        analyzePassword: (password) => core.exec('analyze_password', password),

        checkMissing2FAs: async () => {
            let items: UniqueItem[] = [];

            for (const item of getLoginItems()) {
                const { shareId, itemId } = item;
                if (isHealthCheckSkipped(item)) continue;
                if (!item.data.content.urls) continue;

                const hasOTP =
                    item.data.content.totpUri.v ||
                    item.data.extraFields.some((field) => field.type === 'totp' && field.data.totpUri.v);

                if (!hasOTP) {
                    for (const url of item.data.content.urls) {
                        if (await core.exec('twofa_domain_eligible', url)) {
                            items.push({ shareId, itemId });
                            break;
                        }
                    }
                }
            }

            return items;
        },

        checkWeakPasswords: async () => {
            let items: UniqueItem[] = [];

            for (const item of getLoginItems()) {
                if (isHealthCheckSkipped(item)) continue;
                if (item.data.content.password.v) {
                    const { shareId, itemId } = item;
                    const password = deobfuscate(item.data.content.password);
                    const score = (await service.analyzePassword(password)).password_score;

                    switch (score) {
                        case 'Vulnerable':
                        case 'Weak':
                            items.push({ shareId, itemId });
                    }
                }
            }

            return items;
        },
    };

    return service;
};
