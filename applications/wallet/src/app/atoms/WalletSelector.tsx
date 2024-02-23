import { c } from 'ttag';

import {
    AccountWithBlockchainData,
    LightningUriFormat,
    WalletType,
    WalletWithAccountsWithBalanceAndTxs,
} from '../types';
import { getSelectedAccount } from '../utils';
import { Selector } from './Selector';

export interface WalletAndAccountSelectorValue {
    wallet?: WalletWithAccountsWithBalanceAndTxs;
    account?: AccountWithBlockchainData;
    format?: LightningUriFormat;
}

interface Props {
    wallets?: WalletWithAccountsWithBalanceAndTxs[];
    value: WalletAndAccountSelectorValue;
    onSelect: (value: WalletAndAccountSelectorValue) => void;
    label?: { wallet: string; account: string; format: string };
}

const getLightningFormatOptions: () => { name: string; value: LightningUriFormat }[] = () => [
    { name: c('Bitcoin Receive').t`Unified`, value: LightningUriFormat.UNIFIED },
    { name: c('Bitcoin Receive').t`Onchain`, value: LightningUriFormat.ONCHAIN },
    { name: c('Bitcoin Receive').t`Lightning`, value: LightningUriFormat.LIGHTNING },
];

export const getDefaultFormat = () => getLightningFormatOptions()[0];

export const WalletSelector = ({
    wallets,
    value,
    onSelect,
    label = {
        wallet: c('Wallet Send').t`Send from wallet`,
        account: c('Wallet Send').t`with account`,
        format: c('Wallet Receive').t`using format`,
    },
}: Props) => {
    const lightningFormatsOptions = getLightningFormatOptions();

    return (
        <div className="flex flex-row grow">
            <div className="w-1/2">
                <Selector
                    id="wallet-selector"
                    label={label.wallet}
                    selected={value?.wallet?.Wallet.ID}
                    onSelect={(event) => {
                        const wallet = wallets?.find(({ Wallet: { ID: WalletID } }) => WalletID === event.value);
                        if (wallet) {
                            onSelect({ wallet });
                        }
                    }}
                    options={wallets?.map(({ Wallet: { Name, ID } }) => ({ value: ID, label: Name })) ?? []}
                />
            </div>

            {value?.wallet?.Wallet.Type === WalletType.OnChain && (
                <div className="w-1/2">
                    <Selector
                        id="account-selector"
                        label={label.account}
                        selected={value?.account?.ID}
                        onSelect={(event) => {
                            const account = getSelectedAccount(value.wallet, event.value);
                            if (account) {
                                onSelect({ account });
                            }
                        }}
                        options={value?.wallet.accounts.map((account) => ({
                            value: account.ID,
                            label: account.Label,
                        }))}
                    />
                </div>
            )}

            {value?.wallet?.Wallet.Type === WalletType.Lightning && (
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
