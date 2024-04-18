import type { WasmPasswordScoreResult } from '@protontech/pass-rust-core';

import type { PassCoreService } from '@proton/pass/lib/core/service';
import type { LoginItem, MaybeNull, MaybePromise } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

export interface MonitorService {
    analyzePassword: (password: string) => MaybeNull<WasmPasswordScoreResult>;
    domain2FAEligible: (domain: string) => boolean;
    checkMissing2FAs: (items: LoginItem[]) => LoginItem[];
    checkWeakPasswords: (items: LoginItem[]) => LoginItem[];
}

export type MonitorServiceBridge = {
    [K in keyof MonitorService]: (
        ...args: Parameters<MonitorService[K]>
    ) => MaybePromise<ReturnType<MonitorService[K]>>;
};

export const createMonitorService = (core: PassCoreService): MonitorService => {
    const service: MonitorService = {
        analyzePassword: (password) => core.bindings?.analyze_password(password) ?? null,
        domain2FAEligible: (domain) => core.bindings?.twofa_domain_eligible(domain) ?? false,

        checkMissing2FAs: (items) =>
            items.reduce<LoginItem[]>((acc, item) => {
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

        checkWeakPasswords: (items) =>
            items.reduce<LoginItem[]>((acc, item) => {
                if (item.data.content.password.v) {
                    const password = deobfuscate(item.data.content.password);
                    const score = service.analyzePassword(password)?.password_score;

                    switch (score) {
                        case 'Vulnerable':
                        case 'Weak':
                            acc.push(item);
                    }
                }

                return acc;
            }, []),
    };

    return service;
};
