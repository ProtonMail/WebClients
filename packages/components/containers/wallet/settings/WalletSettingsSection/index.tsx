import React from 'react';
import { useParams } from 'react-router';

import { c } from 'ttag';

import { SectionConfig, SubSettingsSection } from '@proton/components/containers/layout';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';

import { AccountsSettingsSubSection } from './AccountsSettingsSubSection';
import { AddressesSettingsSubSection } from './AddressesSettingsSubSection';
import { ChannelsSettingsSubSection } from './ChannelsSettingsSubSection';
import { InvoicesSettingsSubSection } from './InvoicesSettingsSubSection';

interface Props {
    config: SectionConfig;
}

// TODO: Connect this to API a5f253e4
const wallets: any[] = [
    { kind: 'lightning', name: 'Lightning 01', id: 0 },
    { kind: 'onchain', name: 'Bitcoin 01', id: 1 },
];

type SubsectionId = 'invoices' | 'channels' | 'accounts' | 'addresses';

const subsectionBySubSectionId: Record<SubsectionId, () => React.JSX.Element> = {
    invoices: InvoicesSettingsSubSection,
    channels: ChannelsSettingsSubSection,
    accounts: AccountsSettingsSubSection,
    addresses: AddressesSettingsSubSection,
};

export const WalletSettingsSection = ({ config }: Props) => {
    const { walletId } = useParams<{ walletId: string }>();

    const wallet = wallets.find((wallet) => String(wallet.id) === String(walletId));

    const [description, subsections]: [string, SubsectionId[]] =
        wallet.kind === 'lightning'
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

    return (
        <PrivateMainSettingsAreaBase title={wallet.name} description={description}>
            {config.subsections
                .filter((subsection) => subsections.includes(subsection.id as SubsectionId))
                .map((subsection) => {
                    const SubSection = subsectionBySubSectionId[subsection.id as SubsectionId];

                    return (
                        <SubSettingsSection
                            key={subsection.id}
                            id={subsection.id}
                            title={subsection.text}
                            className="container-section-sticky-section"
                        >
                            <SubSection />
                        </SubSettingsSection>
                    );
                })}
        </PrivateMainSettingsAreaBase>
    );
};
