import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { ModalOwnProps } from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { Modal } from '../../atoms';
import { AccountPreferences } from '../AccountPreferences';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    otherWallets: IWasmApiWalletData[];
    walletAccount: WasmApiWalletAccount;
}

export const AccountPreferencesModal = ({ wallet, otherWallets, walletAccount, ...modalProps }: Props) => {
    return (
        <Modal
            title={c('Wallet preference').t`Your account preferences`}
            enableCloseWhenClickOutside
            size="large"
            {...modalProps}
        >
            <div className="flex flex-column">
                <AccountPreferences
                    key={walletAccount.ID}
                    wallet={wallet}
                    walletAccount={walletAccount}
                    otherWallets={otherWallets}
                />
            </div>
        </Modal>
    );
};
