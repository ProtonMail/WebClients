import { apiWalletTransactionDataReducer } from './apiWalletTransactionData';
import { apiWalletsDataReducer } from './apiWalletsData';
import { bitcoinAddressHighestIndexReducer } from './bitcoinAddressHighestIndex';
import { bitcoinNetworkReducer } from './bitcoinNetwork';
import { countriesByProviderReducer } from './countriesByProvider';
import { exchangeRateReducer } from './exchangeRate';
import { fiatCurrenciesReducer } from './fiatCurrencies';
import { fiatCurrenciesByProviderReducer } from './fiatCurrenciesByProvider';
import { gatewaysPublicApiKeysReducer } from './gatewaysPublicApiKeys';
import { paymentMethodsByProviderReducer } from './paymentMethodByProvider';
import { priceGraphDataReducer } from './priceGraphData';
import { quotesByProviderReducer } from './quotesByProvider';
import { remainingInvitesReducer } from './remainingInvites';
import { userEligibilityReducer } from './userEligibility';
import { userWalletSettingsReducer } from './userWalletSettings';
import { walletSettingsReducer } from './walletSettings';

export * from './apiWalletsData';
export * from './apiWalletTransactionData';
export * from './bitcoinAddressHighestIndex';
export * from './bitcoinNetwork';
export * from './countriesByProvider';
export * from './exchangeRate';
export * from './fiatCurrencies';
export * from './fiatCurrenciesByProvider';
export * from './gatewaysPublicApiKeys';
export * from './paymentMethodByProvider';
export * from './priceGraphData';
export * from './quotesByProvider';
export * from './remainingInvites';
export * from './userEligibility';
export * from './userWalletSettings';
export * from './walletSettings';

export const walletReducers = {
    ...exchangeRateReducer,
    ...apiWalletTransactionDataReducer,
    ...bitcoinAddressHighestIndexReducer,
    ...fiatCurrenciesReducer,
    ...fiatCurrenciesByProviderReducer,
    ...countriesByProviderReducer,
    ...paymentMethodsByProviderReducer,
    ...quotesByProviderReducer,
    ...gatewaysPublicApiKeysReducer,
    ...userEligibilityReducer,
    ...remainingInvitesReducer,
    ...priceGraphDataReducer,
    ...apiWalletsDataReducer,
    ...walletSettingsReducer,
    ...bitcoinNetworkReducer,
    ...userWalletSettingsReducer,
};
