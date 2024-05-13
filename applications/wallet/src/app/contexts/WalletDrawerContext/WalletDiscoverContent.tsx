import { useState } from 'react';

import { c } from 'ttag';

import { WasmMnemonic } from '@proton/andromeda';
import { Icon, useModalState } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { hasBit, setBit } from '@proton/shared/lib/helpers/bitset';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { WalletCreationModal } from '../../components/WalletCreationModal';
import { WalletSetupScheme } from '../../hooks/useWalletSetup/type';

interface ChecklistItemProps {
    done?: boolean;
    text: string;
    onClick?: () => void;
}

enum ChecklistItems {
    ClaimWallet = 1,
    BackupAccount = 2,
    BackupWallet = 4,
    Setup2FA = 8,
}

const ChecklistItem = ({ text, done, onClick }: ChecklistItemProps) => {
    return (
        <button
            onClick={() => onClick?.()}
            className="bg-weak flex flex-row items-center py-5 px-6 color-primary cursor-pointer"
            style={{ borderRadius: '24px' }}
        >
            <Icon className="mr-4" name={done ? 'circle-filled' : 'circle'} size={6} />
            <span className={clsx(done && 'text-strike')}>{text}</span>
            <Icon className="ml-auto" name="chevron-right" />
        </button>
    );
};

const DiscoverPreview = () => {
    return (
        <div className="flex flex-row flex-nowrap">
            <div
                className="w-custom h-custom bg-danger no-shrink mr-4"
                style={{ '--w-custom': '6rem', '--h-custom': '6rem', borderRadius: '24px' }}
            ></div>

            <div className="flex flex-column">
                <span className="block mb-1">Your First Bitcoin Purchase: A Step-by-Step Guide</span>
                <span className="block color-weak">37m</span>
            </div>
        </div>
    );
};

interface Props {
    wallet?: IWasmApiWalletData;
}

export const WalletDiscoverContent = ({ wallet }: Props) => {
    const [checkedItem, setCheckedItem] = useState(1);
    const [walletSetupModal, setWalletSetupModal] = useModalState({
        onClose: () => {
            setCheckedItem(setBit(checkedItem, ChecklistItems.BackupWallet));
        },
    });

    return (
        <>
            <div className="flex flex-column">
                <div className="flex flex-column mb-10">
                    <div className="text-3xl text-semibold mb-6">{c('Wallet discover')
                        .t`Finish your account set up`}</div>

                    <div className="flex flex-column gap-1">
                        <ChecklistItem
                            done={hasBit(checkedItem, ChecklistItems.ClaimWallet)}
                            text={c('Wallet discover').t`Claim your wallet`}
                        />
                        <ChecklistItem
                            done={hasBit(checkedItem, ChecklistItems.BackupAccount)}
                            text={c('Wallet discover').t`Backup your ${BRAND_NAME} account`}
                        />
                        <ChecklistItem
                            done={hasBit(checkedItem, ChecklistItems.BackupWallet)}
                            text={c('Wallet discover').t`Backup your wallet's mnemonic`}
                            onClick={() => {
                                setWalletSetupModal(true);
                            }}
                        />
                        <ChecklistItem
                            done={hasBit(checkedItem, ChecklistItems.Setup2FA)}
                            text={c('Wallet discover').t`Set up your 2FA`}
                        />
                    </div>
                </div>

                <div className="flex flex-column mb-10">
                    <div className="text-3xl text-semibold mb-6">{c('Wallet discover').t`Discover`}</div>

                    <div className="flex flex-column gap-2">
                        <DiscoverPreview />
                        <DiscoverPreview />
                        <DiscoverPreview />
                        <DiscoverPreview />
                    </div>
                </div>
            </div>

            {wallet?.Wallet.Mnemonic && (
                <WalletCreationModal
                    schemeAndData={{
                        scheme: WalletSetupScheme.WalletAutocreationBackup,
                        mnemonic: WasmMnemonic.fromString(wallet.Wallet.Mnemonic),
                    }}
                    {...walletSetupModal}
                />
            )}
        </>
    );
};
