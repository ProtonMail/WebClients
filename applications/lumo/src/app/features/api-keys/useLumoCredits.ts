import { useEffect, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';
import {
    type LumoCreditResponse,
    getLumoCreditConfig,
    updateLumoCreditAutoTopUpConfig,
} from '@proton/payments/core/api/lumoCredit';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { ApiBalanceSettings } from './ApiBalanceSettingsModal';

const DEFAULT_AUTO_TOP_UP_AMOUNT = 50;
const DEFAULT_AUTO_TOP_UP_THRESHOLD = 20;
const DEFAULT_SPENDING_LIMIT = 250;
const BALANCE_POLL_INTERVAL_MS = 3000;
const BALANCE_POLL_ATTEMPTS = 5;

const parseCredits = (credits?: string) => {
    if (!credits) {
        return undefined;
    }
    const amount = Number(credits);
    return Number.isFinite(amount) ? amount : undefined;
};

const getBalanceSettings = (response?: LumoCreditResponse): ApiBalanceSettings => ({
    autoTopUp: {
        enabled: response?.AutoTopUp.Enabled ?? false,
        amount: response?.AutoTopUp.Quantity ?? DEFAULT_AUTO_TOP_UP_AMOUNT,
        threshold: response?.AutoTopUp.Threshold ?? DEFAULT_AUTO_TOP_UP_THRESHOLD,
    },
    spendingLimit: {
        enabled: response?.AutoTopUp.SpendingLimitEnabled ?? false,
        limit: response?.AutoTopUp.SpendingLimit ?? DEFAULT_SPENDING_LIMIT,
    },
});

export const useLumoCredits = () => {
    const api = useApi();
    const [{ response, error }, setState] = useState<{ response?: LumoCreditResponse; error?: unknown }>({});

    const fetchCredits = () =>
        api<LumoCreditResponse>({ ...getLumoCreditConfig(), silence: true }).then(
            (response) => {
                setState({ response });
                return response;
            },
            (error) => {
                setState((previous) => (previous.response ? previous : { error }));
                return undefined;
            }
        );

    useEffect(() => {
        void fetchCredits();
    }, []);

    const settings = getBalanceSettings(response);

    const waitForBalanceIncrease = async () => {
        const initialBalance = parseCredits(response?.Balance) ?? 0;
        for (let attempt = 0; attempt < BALANCE_POLL_ATTEMPTS; attempt++) {
            await wait(BALANCE_POLL_INTERVAL_MS);
            const latest = await fetchCredits();
            if ((parseCredits(latest?.Balance) ?? 0) > initialBalance) {
                return;
            }
        }
    };

    const saveSettings = async ({ autoTopUp, spendingLimit }: ApiBalanceSettings) => {
        await api(
            updateLumoCreditAutoTopUpConfig({
                Enabled: autoTopUp.enabled,
                Quantity: autoTopUp.amount,
                SpendingLimitEnabled: spendingLimit.enabled,
                SpendingLimit: spendingLimit.limit,
            })
        );
        await fetchCredits();
    };

    return {
        balance: parseCredits(response?.Balance),
        spent: response?.AutoTopUp.Spent ?? 0,
        settings,
        autoTopUpStatus: response?.AutoTopUp.Status,
        autoTopUpReason: response?.AutoTopUp.Reason,
        loading: !response && !error,
        error,
        saveSettings,
        waitForBalanceIncrease,
    };
};
