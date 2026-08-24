import { c, msgid } from 'ttag';

import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { Tabs } from '@proton/components/components/tabs/Tabs';

import { epochToRelativeDaysAgo } from '../../../../utils/time/format';
import { PassModal } from '../../../Layout/Modal/PassModal';
import { useAliasDomains, useCustomDomain } from './AliasDomainsContext';
import { CustomDomainDNS } from './CustomDomainDNS';
import { DomainDetailsInfo } from './CustomDomainInfo';

type Props = {
    domainID: number;
    tab: 'dns' | 'info';
};

export const CustomDomainDetailsModal = ({ tab, domainID }: Props) => {
    const { setAction } = useAliasDomains();
    const onClose = () => setAction(null);

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
