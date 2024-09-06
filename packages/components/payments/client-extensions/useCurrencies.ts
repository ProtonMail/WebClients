import { useFlag } from '@proton/unleash';

import { getAvailableCurrencies, getPreferredCurrency } from '../core';

export type GetPreferredCurrencyParams = Omit<Parameters<typeof getPreferredCurrency>[0], 'regionalCurrenciesEnabled'>;

export type Flow = 'vpn' | 'v2-signup' | 'dashboard';

export const useCurrencies = (flow?: Flow) => {
    const vpnSignupRegionalCurrencyEnabled = useFlag('VpnSignupRegionalCurrency');
    const v2SignupRegionalCurrencyEnabled = useFlag('V2SignupRegionalCurrency');
    const dashboardRegionalCurrencyEnabled = useFlag('DashboardRegionalCurrency');

    const regionalCurrenciesEnabled = (() => {
        if (flow === 'vpn') {
            return vpnSignupRegionalCurrencyEnabled;
        } else if (flow === 'v2-signup') {
            return v2SignupRegionalCurrencyEnabled;
        }

        return dashboardRegionalCurrencyEnabled;
    })();

    return {
        getPreferredCurrency: (params: GetPreferredCurrencyParams) =>
            getPreferredCurrency({
                ...params,
                regionalCurrenciesEnabled,
            }),

        getAvailableCurrencies: (
            params: Omit<Parameters<typeof getAvailableCurrencies>[0], 'regionalCurrenciesEnabled'>
        ) =>
            getAvailableCurrencies({
                ...params,
                regionalCurrenciesEnabled,
            }),
        dashboardRegionalCurrencyEnabled,
    };
};
