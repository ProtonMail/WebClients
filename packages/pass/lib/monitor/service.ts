import type { WasmPasswordScoreResult } from '@protontech/pass-rust-core';
import type { Store } from 'redux';

import type { PassCoreService } from '@proton/pass/lib/core/service';
import { selectLoginItems } from '@proton/pass/store/selectors';
import type { MaybeNull, MaybePromise, UniqueItem } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export interface MonitorService {
    analyzePassword: (password: string) => MaybeNull<WasmPasswordScoreResult>;
    domain2FAEligible: (domain: string) => boolean;
    checkMissing2FAs: () => UniqueItem[];
    checkWeakPasswords: () => UniqueItem[];
}

export type MonitorServiceBridge = {
    [K in keyof MonitorService]: (
        ...args: Parameters<MonitorService[K]>
    ) => MaybePromise<ReturnType<MonitorService[K]>>;
};

export const createMonitorService = (core: PassCoreService, store: Store): MonitorService => {
    const getLoginItems = () => selectLoginItems(store.getState());

    const service: MonitorService = {
        analyzePassword: (password) => core.bindings?.analyze_password(password) ?? null,
        domain2FAEligible: (domain) => core.bindings?.twofa_domain_eligible(domain) ?? false,

        checkMissing2FAs: () =>
            getLoginItems().reduce<UniqueItem[]>((acc, item) => {
                const { shareId, itemId } = item;
                if (!item.data.content.urls) return acc;

                const hasOTP =
                    item.data.content.totpUri.v ||
                    item.data.extraFields.some((field) => field.type === 'totp' && field.data.totpUri.v);

                if (!hasOTP) {
                    const item2FAEligible = item.data.content.urls.some(service.domain2FAEligible);
                    if (item2FAEligible) acc.push({ shareId, itemId });
                }

                return acc;
            }, []),

        checkWeakPasswords: () =>
            getLoginItems().reduce<UniqueItem[]>((acc, item) => {
                if (item.data.content.password.v) {
                    const { shareId, itemId } = item;
                    const password = deobfuscate(item.data.content.password);
                    const score = service.analyzePassword(password)?.password_score;

                    switch (score) {
                        case 'Vulnerable':
                        case 'Weak':
                            acc.push({ shareId, itemId });
                    }
                }

                return acc;
            }, []),
    };

    return service;
};
