import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { IWasmApiWalletData, WalletType } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { LightningUriFormat } from '../types';
import { getSelectedAccount } from '../utils';
import { Selector } from './Selector';

export interface WalletAndAccountSelectorValue {
    apiWalletData?: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    format?: LightningUriFormat;
}

interface Props {
    apiWalletsData?: IWasmApiWalletData[];
    onlyValidWallet?: boolean;
    value: WalletAndAccountSelectorValue;
    label?: { wallet: string; account: string; format: string };
    onSelect: (value: WalletAndAccountSelectorValue) => void;
}

const getLightningFormatOptions: () => { name: string; value: LightningUriFormat }[] = () => [
    { name: c('Bitcoin Receive').t`Unified`, value: LightningUriFormat.UNIFIED },
    { name: c('Bitcoin Receive').t`Onchain`, value: LightningUriFormat.ONCHAIN },
    { name: c('Bitcoin Receive').t`Lightning`, value: LightningUriFormat.LIGHTNING },
];

export const getDefaultFormat = () => getLightningFormatOptions()[0];

export const WalletSelector = ({
    apiWalletsData,
    onlyValidWallet,
    value,
    onSelect,
    label = {
        wallet: c('Wallet Send').t`Send from wallet`,
        account: c('Wallet Send').t`with account`,
        format: c('Wallet Receive').t`using format`,
    },
}: Props) => {
    const { walletsChainData } = useBitcoinBlockchainContext();
    const lightningFormatsOptions = getLightningFormatOptions();

    return (
        <div className="flex flex-row grow">
            <div className="w-1/2">
                <Selector
                    id="wallet-selector"
                    label={label.wallet}
                    selected={value?.apiWalletData?.Wallet.ID}
                    onSelect={(event) => {
                        const apiWallet = apiWalletsData?.find(
                            ({ Wallet: { ID: WalletID } }) => WalletID === event.value
                        );
                        if (apiWallet) {
                            onSelect({ apiWalletData: apiWallet });
                        }
                    }}
                    options={
                        apiWalletsData?.map(({ Wallet: { Name, ID } }) => ({
                            value: ID,
                            label: Name,
                            disabled: onlyValidWallet && !walletsChainData[ID],
                        })) ?? []
                    }
                />
            </div>

            {value?.apiWalletData?.Wallet.Type === WalletType.OnChain && (
                <div className="w-1/2">
                    <Selector
                        id="account-selector"
                        label={label.account}
                        selected={value?.apiAccount?.ID}
                        disabled={!value.apiWalletData.WalletAccounts.length}
                        onSelect={(event) => {
                            const apiAccount = getSelectedAccount(value.apiWalletData, event.value);
                            if (apiAccount) {
                                onSelect({ apiAccount });
                            }
                        }}
                        options={value?.apiWalletData.WalletAccounts.map((apiAccount) => ({
                            value: apiAccount.ID,
                            label: apiAccount.Label,
                            disabled:
                                onlyValidWallet &&
                                (!value?.apiWalletData?.Wallet.ID ||
                                    !walletsChainData[value?.apiWalletData?.Wallet.ID]?.accounts[apiAccount.ID]),
                        }))}
                    />
                </div>
            )}

            {value?.apiWalletData?.Wallet?.Type === WalletType.Lightning && (
                <div className="w-1/2">
                    <Selector
                        id="format-selector"
                        label={label.format}
                        selected={value.format}
                        onSelect={({ value }) => {
                            onSelect({
                                format: (
                                    lightningFormatsOptions.find((format) => format.value === value) ??
                                    getDefaultFormat()
                                ).value,
                            });
                        }}
                        options={getLightningFormatOptions().map((format) => ({
                            value: format.value,
                            label: format.name,
                        }))}
                    />
                </div>
            )}
        </div>
    );
};
