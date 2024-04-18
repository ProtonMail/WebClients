import type { WasmPasswordScoreResult } from '@protontech/pass-rust-core';

import type { PassCoreService } from '@proton/pass/lib/core/service';
import type { ItemRevision, MaybeNull, MaybePromise } from '@proton/pass/types';

export interface MonitorService {
    analyzePassword: (password: string) => MaybePromise<MaybeNull<WasmPasswordScoreResult>>;
    domain2FAEligible: (domain: string) => MaybePromise<boolean>;
    checkMissing2FAs: (items: ItemRevision<'login'>[]) => MaybePromise<ItemRevision<'login'>[]>;
}

export const createMonitorService = (core: PassCoreService): MonitorService => {
    const service: MonitorService = {
        analyzePassword: (password) => core.bindings?.analyze_password(password) ?? null,
        domain2FAEligible: (domain) => core.bindings?.twofa_domain_eligible(domain) ?? false,

        checkMissing2FAs: (items) =>
            items.reduce<ItemRevision<'login'>[]>((acc, item) => {
                if (!item.data.content.urls) return acc;

                const hasOTP =
                    item.data.content.totpUri.v ||
                    item.data.extraFields.some((field) => field.type === 'totp' && field.data.totpUri.v);

                if (!hasOTP) {
                    const item2FAEligible = item.data.content.urls.some(service.domain2FAEligible);
                    if (item2FAEligible) acc.push(item);
                }

                return acc;
            }, []),
    };

    return service;
};
