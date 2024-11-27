import { c, msgid } from 'ttag';

import { ModalTwoContent, ModalTwoHeader, Tabs } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { CustomDomainDNS } from '@proton/pass/components/Settings/Aliases/Domains/CustomDomainDNS';
import { DomainDetailsInfo } from '@proton/pass/components/Settings/Aliases/Domains/CustomDomainInfo';
import { epochToRelativeDaysAgo } from '@proton/pass/utils/time/format';

import { useAliasDomains, useCustomDomain } from './DomainsProvider';

type Props = {
    domainID: number;
    tab: 'dns' | 'info';
    onClose: () => void;
};

export const CustomDomainDetailsModal = ({ tab, domainID, onClose }: Props) => {
    const { setAction } = useAliasDomains();
    const domain = useCustomDomain(domainID);
    const aliasCount = domain?.AliasCount ?? 0;
    const time = epochToRelativeDaysAgo(domain?.CreateTime ?? 0);

    const tabs = [
        {
            name: 'info',
            title: c('Label').t`Info`,
            content: <DomainDetailsInfo domainID={domainID} />,
        } as const,
        {
            name: 'dns',
            title: c('Label').t`DNS`,
            content: <CustomDomainDNS domainID={domainID} />,
        } as const,
    ];

    const tabIndex = (name: string) => {
        const idx = tabs.findIndex((tab) => tab.name === name);
        return idx !== -1 ? idx : 0;
    };

    return (
        <PassModal onClose={onClose} open onReset={onClose} size="xlarge">
            <ModalTwoHeader
                title={domain?.Domain}
                subline={
                    <>
                        <span>{
                            // translator: when a custom domain was created. Full example sentence: Created 2 days ago.
                            c('Info').t`Created ${time}.`
                        }</span>{' '}
                        <span>
                            {c('Label').ngettext(msgid`${aliasCount} alias`, `${aliasCount} aliases`, aliasCount)}
                        </span>
                    </>
                }
            />
            <ModalTwoContent>
                <Tabs
                    tabs={tabs}
                    value={tabIndex(tab)}
                    onChange={(index) => setAction({ type: tabs[index].name, domainID })}
                />
            </ModalTwoContent>
        </PassModal>
    );
};
