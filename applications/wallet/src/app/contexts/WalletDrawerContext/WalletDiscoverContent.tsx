import { useMemo } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Icon, SettingsLink } from '@proton/components';
import { useUser, useUserSettings } from '@proton/components/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData } from '@proton/wallet';
import { disabledWalletShowRecovery, useWalletApi } from '@proton/wallet';

import { type DiscoverArticle, articles } from '../../constants/discover';
import { getThemeForWallet } from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../WalletSetupModalContext';

import './WalletDiscoverContent.scss';

interface ChecklistItemProps {
    done?: boolean;
    text: string;
    onClick?: () => void;
    path?: string;
}

const ChecklistItem = ({ text, done, onClick, path }: ChecklistItemProps) => {
    const containerClassname =
        'bg-weak flex flex-row flex-nowrap items-center py-5 px-6 color-primary cursor-pointer rounded-xl';

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
                {content}
            </SettingsLink>
        );
    }

    return (
        <button onClick={() => onClick?.()} className={containerClassname}>
            {content}
        </button>
    );
};

const DiscoverPreview = ({ title, text, previewSrc, coverSrc, link }: DiscoverArticle) => {
    return (
        <Href
            className="discover-preview h-custom flex flex-row flex-nowrap items-start w-full gap-4"
            target="_blank"
            href={link}
        >
            <div className="shrink-0 h-full rounded-2xl overflow-hidden ratio-square">
                <img
                    src={previewSrc || coverSrc}
                    alt=""
                    className="object-cover h-full w-full w-custom"
                    style={{ '--w-custom': '6rem' }}
                />
            </div>

            <div className="h-full flex flex-column flex-nowrap">
                <h3 className="text-lg my-0 w-full mb-2 text-ellipsis-two-lines">{title}</h3>
                <p className="my-0 w-full color-hint text-ellipsis-two-lines">{text}</p>
            </div>
        </Href>
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

    const discoverArticles = useMemo(() => articles(), []);

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
        <div className="block h-full">
            <div className="flex flex-column h-full">
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

                <div className="flex flex-column mb-10">
                    <div className="w-full text-3xl text-semibold mb-6">{c('Wallet discover').t`Discover`}</div>

                    <div className="w-full flex flex-column gap-8">
                        {discoverArticles.map((article) => {
                            return <DiscoverPreview {...article} key={article.id} />;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
