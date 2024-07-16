import { type WasmUserSettings } from '@proton/andromeda';
import { createHooks } from '@proton/redux-utilities';

import { DEFAULT_DISPLAY_BITCOIN_UNIT, DEFAULT_FIAT_CURRENCY } from '../../constants/bitcoin';
import { selectUserWalletSettings, userWalletSettingsThunk } from '../slices';

const hooks = createHooks(userWalletSettingsThunk, selectUserWalletSettings);

export const useGetUserWalletSettings = hooks.useGet;

const DEFAULT_STATE: WasmUserSettings = {
    BitcoinUnit: DEFAULT_DISPLAY_BITCOIN_UNIT,
    FiatCurrency: DEFAULT_FIAT_CURRENCY,
    HideEmptyUsedAddresses: 0,
    TwoFactorAmountThreshold: null,
    ReceiveEmailIntegrationNotification: null,
    ReceiveInviterNotification: null,
    WalletCreated: null,
    AcceptTermsAndConditions: 0,
};

export const useUserWalletSettings = (): [WasmUserSettings, boolean] => {
    const [value, loadingValue] = hooks.useValue();
    return [value ?? DEFAULT_STATE, loadingValue];
};
