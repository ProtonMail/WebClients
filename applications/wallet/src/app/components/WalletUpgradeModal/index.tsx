import { c } from 'ttag';

import { ModalOwnProps, Prompt } from '@proton/components/components';
import upgradeWalletSrc from '@proton/styles/assets/img/illustrations/wallet-upgrade.svg';

import { Button } from '../../atoms';
import { SubTheme } from '../../utils';

export interface WalletUpgradeModalOwnProps {
    title?: string;
    theme?: SubTheme;
    content: string;
}

type Props = WalletUpgradeModalOwnProps & ModalOwnProps;

export const WalletUpgradeModal = ({ title, content, theme, ...modalProps }: Props) => {
    return (
        <Prompt
            {...modalProps}
            className={theme}
            buttons={[
                <Button fullWidth shadow size="large" shape="solid" color="norm">
                    {c('Action').t`Upgrade now`}
                </Button>,
                <Button fullWidth size="large" shape="solid" color="weak" onClick={modalProps.onClose}>{c('Wallet')
                    .t`Close`}</Button>,
            ]}
        >
            <div className="flex flex-column items-center text-center">
                <img src={upgradeWalletSrc} alt="" />
                <h1 className="my-4 text-semibold text-3xl">
                    {title ?? c('Wallet Upgrade').t`Upgrade to support financial freedom`}
                </h1>
                <p className="mt-0 text-center">{content}</p>
            </div>
        </Prompt>
    );
};
