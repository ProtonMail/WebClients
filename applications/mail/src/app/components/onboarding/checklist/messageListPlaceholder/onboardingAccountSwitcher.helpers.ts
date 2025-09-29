import type { OnlineServicesKey } from '../constants';

export const getFinanceServicesByCountry = ({
    category,
    countryLocation,
}: {
    category: 'finance' | 'social-media' | 'shopping';
    countryLocation: string | undefined;
}) => {
    if (category === 'finance') {
        if (countryLocation === 'GB') {
            return ['hsbc', 'barclays', 'lloyds'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'FR') {
            return ['bnp-paribas', 'credit-agricole', 'banque-populaire'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'DE') {
            return ['deutsche-bank', 'dz-bank', 'kfw'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'ES') {
            return ['santander', 'bbva', 'caixa-bank'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'CH') {
            return ['ubs', 'raiffeisen', 'zurcher-kantonalbank'] satisfies OnlineServicesKey[];
        }
        // Default to US
        return ['bank-of-america', 'american-express', 'capital-one'] satisfies OnlineServicesKey[];
    } else if (category === 'social-media') {
        return ['facebook', 'instagram', 'tiktok'] satisfies OnlineServicesKey[];
    } else if (category === 'shopping') {
        return ['amazon', 'ebay', 'aliexpress'] satisfies OnlineServicesKey[];
    } else {
        throw new Error('Invalid category');
    }
};
