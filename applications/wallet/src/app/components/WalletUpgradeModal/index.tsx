import { c } from 'ttag';

import { ModalOwnProps } from '@proton/components/components';
import upgradeWalletSrc from '@proton/styles/assets/img/illustrations/wallet-upgrade.svg';

import { Button, Modal } from '../../atoms';
import { SubTheme } from '../../utils';

export interface WalletUpgradeModalOwnProps {
    title?: string;
    theme?: SubTheme;
    content: string;
}

type Props = WalletUpgradeModalOwnProps & ModalOwnProps;

export const WalletUpgradeModal = ({ title, content, theme, ...modalProps }: Props) => {
    return (
        <Modal {...modalProps} className={theme}>
            <div className="flex flex-column items-center">
                <img src={upgradeWalletSrc} alt="" />

                <h1 className="my-4 text-semibold text-3xl">{title ?? c('Wallet Upgrade').t`Upgrade your privacy`}</h1>

                <p className="mt-0 mb-8 color-hint text-center">{content}</p>

                <Button className="my-8 mx-auto w-4/5" size="large" shape="solid" color="norm">{c('Wallet Upgrade')
                    .t`Upgrade now`}</Button>
            </div>
        </Modal>
    );
};
