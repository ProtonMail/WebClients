import { c } from 'ttag';

import { Icon, SettingsLink } from '@proton/components/components';
import { useUser, useUserSettings } from '@proton/components/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData, disabledWalletShowRecovery, useWalletApi } from '@proton/wallet';

import { getThemeForWallet } from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../WalletSetupModalContext';

interface ChecklistItemProps {
    done?: boolean;
    text: string;
    onClick?: () => void;
    path?: string;
}

const ChecklistItem = ({ text, done, onClick, path }: ChecklistItemProps) => {
    const containerClassname = 'bg-weak flex flex-row items-center py-5 px-6 color-primary cursor-pointer rounded-xl';
    const content = (
        <>
            <Icon className="mr-4" name={done ? 'circle-filled' : 'circle'} size={6} />
            <span className={clsx(done && 'text-strike')}>{text}</span>
            <Icon className="ml-auto" name="chevron-right" />
        </>
    );

    if (path) {
        return (
            <SettingsLink target="_blank" className={containerClassname} path={path} style={{ textDecoration: 'none' }}>
                <Icon className="mr-4" name={done ? 'circle-filled' : 'circle'} size={6} />
                <span className={clsx(done && 'text-strike')}>{text}</span>
                <Icon className="ml-auto" name="chevron-right" />
            </SettingsLink>
        );
    }

    return (
        <button onClick={() => onClick?.()} className={containerClassname}>
            {content}
        </button>
    );
};

const DiscoverPreview = () => {
    return (
        <div className="flex flex-row flex-nowrap">
            <div
                className="w-custom h-custom bg-danger shrink-0 mr-4"
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
    wallet: IWasmApiWalletData;
}

export const WalletDiscoverContent = ({ wallet: initWallet }: Props) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { decryptedApiWalletsData = [] } = useBitcoinBlockchainContext();

    const { open } = useWalletSetupModalContext();
    const walletApi = useWalletApi();
    const dispatch = useDispatch();

    const wallet = decryptedApiWalletsData.find((wa) => wa.Wallet.ID === initWallet.Wallet.ID);
    if (!wallet) {
        return null;
    }

    const handleClickBackupSeedphrase = () => {
        if (wallet.Wallet.Mnemonic) {
            open(
                {
                    theme: getThemeForWallet(decryptedApiWalletsData, wallet.Wallet.ID),
                    kind: WalletSetupModalKind.WalletBackup,
                    apiWalletData: wallet,
                },
                {
                    onClose: () => {
                        void walletApi
                            .clients()
                            .wallet.disableShowWalletRecovery(wallet.Wallet.ID)
                            .then(() => {
                                dispatch(disabledWalletShowRecovery({ walletID: wallet.Wallet.ID }));
                            });
                    },
                }
            );
        }
    };

    return (
        <div className="block">
            <div className="block h-full">
                <div className="flex flex-column flex-nowrap mb-10">
                    <div className="text-3xl text-semibold mb-6">{c('Wallet discover').t`Secure your wallet`}</div>

                    <div className="flex flex-column gap-1">
                        {!wallet.Wallet.IsImported && (
                            <ChecklistItem
                                done={!wallet.WalletSettings?.ShowWalletRecovery}
                                text={c('Wallet discover').t`Backup this wallet's seed phrase`}
                                onClick={() => {
                                    handleClickBackupSeedphrase();
                                }}
                            />
                        )}

                        <ChecklistItem
                            path="/recovery#data"
                            done={Boolean(userSettings.DeviceRecovery || user.MnemonicStatus === MNEMONIC_STATUS.SET)}
                            text={c('Wallet discover').t`Backup your ${BRAND_NAME} account data`}
                        />

                        <ChecklistItem
                            path="/account-password#two-fa"
                            done={Boolean(userSettings['2FA'].Enabled)}
                            text={c('Wallet discover').t`Set up 2FA to secure your account`}
                        />
                    </div>
                </div>

                <div className="block grow">
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
            </div>
        </div>
    );
};
