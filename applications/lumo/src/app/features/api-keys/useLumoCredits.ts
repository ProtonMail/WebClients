import { useEffect, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';
import {
    type LumoCreditResponse,
    getLumoCreditConfig,
    updateLumoCreditAutoTopUpConfig,
    updateLumoCreditSpendingLimitConfig,
} from '@proton/payments/core/api/lumoCredit';
import isTruthy from '@proton/utils/isTruthy';

import type { ApiBalanceSettings } from './ApiBalanceSettingsModal';

type ApiBalanceSettingsSection = keyof ApiBalanceSettings;

export interface ApiBalanceSettingsFailure {
    section: ApiBalanceSettingsSection;
    error: unknown;
}

const DEFAULT_AUTO_TOP_UP_AMOUNT = 50;
const DEFAULT_AUTO_TOP_UP_THRESHOLD = 20;
const DEFAULT_SPENDING_LIMIT = 250;

const parseCredits = (credits?: string) => {
    if (!credits) {
        return undefined;
    }
    const amount = Number(credits);
    return Number.isFinite(amount) ? amount : undefined;
};

const getBalanceSettings = (response?: LumoCreditResponse): ApiBalanceSettings => {
    const usageLimit = parseCredits(response?.UsageLimit) ?? 0;
    return {
        autoTopUp: {
            enabled: response?.AutoTopUp.Enabled ?? false,
            amount: response?.AutoTopUp.Quantity ?? DEFAULT_AUTO_TOP_UP_AMOUNT,
            threshold: response?.AutoTopUp.Threshold ?? DEFAULT_AUTO_TOP_UP_THRESHOLD,
        },
        spendingLimit: {
            enabled: usageLimit > 0,
            limit: usageLimit > 0 ? usageLimit : DEFAULT_SPENDING_LIMIT,
        },
    };
};

export const useLumoCredits = () => {
    const api = useApi();
    const [{ response, error }, setState] = useState<{ response?: LumoCreditResponse; error?: unknown }>({});

    const fetchCredits = () =>
        api<LumoCreditResponse>({ ...getLumoCreditConfig(), silence: true }).then(
            (response) => setState({ response }),
            (error) => setState((previous) => (previous.response ? previous : { error }))
        );

    useEffect(() => {
        void fetchCredits();
    }, []);

    const settings = getBalanceSettings(response);

    const saveSettings = async ({
        autoTopUp,
        spendingLimit,
    }: Partial<ApiBalanceSettings>): Promise<ApiBalanceSettingsFailure[]> => {
        const requests = [
            autoTopUp && {
                section: 'autoTopUp' as const,
                send: () =>
                    api(updateLumoCreditAutoTopUpConfig({ Enabled: autoTopUp.enabled, Quantity: autoTopUp.amount })),
            },
            spendingLimit && {
                section: 'spendingLimit' as const,
                send: () =>
                    api(
                        updateLumoCreditSpendingLimitConfig({
                            Enabled: spendingLimit.enabled,
                            Limit: spendingLimit.limit,
                        })
                    ),
            },
        ].filter(isTruthy);

        const results = await Promise.allSettled(requests.map(({ send }) => send()));
        const failures = requests.flatMap(({ section }, index) => {
            const result = results[index];
            return result.status === 'rejected' ? [{ section, error: result.reason }] : [];
        });

        if (failures.length < requests.length) {
            await fetchCredits();
        }
        return failures;
    };

    return {
        balance: parseCredits(response?.Balance),
        usage: parseCredits(response?.Usage) ?? 0,
        usageLimit: parseCredits(response?.UsageLimit) ?? 0,
        settings,
        autoTopUpStatus: response?.AutoTopUp.Status,
        autoTopUpReason: response?.AutoTopUp.Reason,
        loading: !response && !error,
        error,
        saveSettings,
    };
};
