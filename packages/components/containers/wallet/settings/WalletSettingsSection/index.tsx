import React, { useMemo } from 'react';
import { useParams } from 'react-router';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { SectionConfig, SubSettingsSection } from '@proton/components/containers/layout';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { IWasmApiWalletData, WalletType, useDecryptedApiWalletsData } from '@proton/wallet';

import { AccountsOrderableList } from './AccountsOrderableList';
import { AddressesSettingsSubSection } from './AddressesSettingsSubSection';
import { ChannelsSettingsSubSection } from './ChannelsSettingsSubSection';
import { InvoicesSettingsSubSection } from './InvoicesSettingsSubSection';

interface Props {
    config: SectionConfig;
}

type SubsectionId = 'invoices' | 'channels' | 'accounts' | 'addresses';

const subsectionBySubSectionId: Record<
    SubsectionId,
    ({ wallet, otherWallets }: { wallet: IWasmApiWalletData; otherWallets: IWasmApiWalletData[] }) => React.JSX.Element
> = {
    invoices: InvoicesSettingsSubSection,
    channels: ChannelsSettingsSubSection,
    accounts: AccountsOrderableList,
    addresses: AddressesSettingsSubSection,
};

export const WalletSettingsSection = ({ config }: Props) => {
    const { walletId } = useParams<{ walletId: string }>();

    const { decryptedApiWalletsData: wallets, loading: loadingWallets } = useDecryptedApiWalletsData();

    const wallet = wallets?.find((wallet) => String(wallet.Wallet.ID) === String(walletId));
    const otherWallets = wallets?.filter((wallet) => String(wallet.Wallet.ID) !== String(walletId)) ?? [];

    const content: [string, SubsectionId[]] | null = useMemo(() => {
        if (!wallet) {
            return null;
        }

        return wallet.Wallet.Type === WalletType.Lightning
            ? [
                  c('Wallet Settings')
                      .t`Fine-tune your Lightning wallet experience with these settings. Customize lightning-fast transactions and preferences for a lightning wallet that suits your needs.`,
                  ['invoices', 'channels'],
              ]
            : [
                  c('Wallet Settings')
                      .t`Manage your on-chain wallet effortlessly with these settings. Tailor transaction preferences and security for seamless on-chain Bitcoin management.`,
                  ['accounts', 'addresses'],
              ];
    }, [wallet]);

    if (loadingWallets) {
        return <CircleLoader />;
    }

    if (!wallet) {
        return null;
    }

    const filteredSubsections =
        config.subsections?.filter((subsection) => content?.[1].includes(subsection.id as SubsectionId)) ?? [];

    return (
        <PrivateMainSettingsAreaBase title={wallet?.Wallet.Name ?? ''} description={content?.[0]}>
            {filteredSubsections.map((subsection) => {
                const SubSection = subsectionBySubSectionId[subsection.id as SubsectionId];

                return (
                    <SubSettingsSection
                        key={subsection.id}
                        id={subsection.id}
                        title={subsection.text}
                        className="container-section-sticky-section"
                    >
                        <SubSection wallet={wallet} otherWallets={otherWallets} />
                    </SubSettingsSection>
                );
            })}
        </PrivateMainSettingsAreaBase>
    );
};
