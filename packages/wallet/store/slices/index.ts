import { apiWalletTransactionDataReducer } from './apiWalletTransactionData';
import { apiWalletsDataReducer } from './apiWalletsData';
import { bitcoinAddressHighestIndexReducer } from './bitcoinAddressHighestIndex';
import { bitcoinAddressPoolReducer } from './bitcoinAddressPool';
import { bitcoinAddressUsedIndexesReducer } from './bitcoinAddressUsedIndexes';
import { bitcoinNetworkReducer } from './bitcoinNetwork';
import { countriesByProviderReducer } from './countriesByProvider';
import { exchangeRateReducer } from './exchangeRate';
import { fiatCurrenciesReducer } from './fiatCurrencies';
import { fiatCurrenciesByProviderReducer } from './fiatCurrenciesByProvider';
import { hideAmountsReducer } from './hideAmounts';
import { settingsReducer } from './localSettings';
import { networkFeesReducer } from './networkFees';
import { paymentMethodsByProviderReducer } from './paymentMethodByProvider';
import { priceGraphDataReducer } from './priceGraphData';
import { quotesByProviderReducer } from './quotesByProvider';
import { remainingInvitesReducer } from './remainingInvites';
import { userWalletSettingsReducer } from './userWalletSettings';
import { walletSettingsReducer } from './walletSettings';

export * from './apiWalletsData';
export * from './apiWalletTransactionData';
export * from './bitcoinAddressPool';
export * from './bitcoinAddressHighestIndex';
export * from './bitcoinAddressUsedIndexes';
export * from './bitcoinNetwork';
export * from './countriesByProvider';
export * from './exchangeRate';
export * from './fiatCurrencies';
export * from './fiatCurrenciesByProvider';
export * from './paymentMethodByProvider';
export * from './priceGraphData';
export * from './quotesByProvider';
export * from './remainingInvites';
export * from './userWalletSettings';
export * from './walletSettings';
export * from './hideAmounts';
export * from './networkFees';
export * from './localSettings';

export const walletReducers = {
    ...exchangeRateReducer,
    ...apiWalletTransactionDataReducer,
    ...bitcoinAddressPoolReducer,
    ...bitcoinAddressHighestIndexReducer,
    ...bitcoinAddressUsedIndexesReducer,
    ...fiatCurrenciesReducer,
    ...fiatCurrenciesByProviderReducer,
    ...countriesByProviderReducer,
    ...paymentMethodsByProviderReducer,
    ...quotesByProviderReducer,
    ...remainingInvitesReducer,
    ...priceGraphDataReducer,
    ...apiWalletsDataReducer,
    ...walletSettingsReducer,
    ...bitcoinNetworkReducer,
    ...userWalletSettingsReducer,
    ...hideAmountsReducer,
    ...networkFeesReducer,
    ...settingsReducer,
};
