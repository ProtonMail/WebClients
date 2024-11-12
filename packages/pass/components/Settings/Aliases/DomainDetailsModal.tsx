import { c, msgid } from 'ttag';

import { ModalTwoContent, ModalTwoHeader, Tabs } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { DomainDetailsDNS } from '@proton/pass/components/Settings/Aliases/DomainDetailsDNS';
import { DomainDetailsInfo } from '@proton/pass/components/Settings/Aliases/DomainDetailsInfo';
import { type CustomDomainInfo } from '@proton/pass/components/Settings/Aliases/Domains';
import type { CustomDomainOutput } from '@proton/pass/types';
import { epochToRelativeDaysAgo } from '@proton/pass/utils/time/format';

export enum DomainTab {
    INFO = 'INFO',
    DNS = 'DNS',
}

export const DOMAIN_TABS_ORDER_MAP: { [key: number]: DomainTab } = {
    0: DomainTab.INFO,
    1: DomainTab.DNS,
};

export type Props = {
    onClose: () => void;
    onVerify: (domain: CustomDomainOutput) => void;
    domain: CustomDomainOutput | CustomDomainInfo;
    tab: DomainTab;
    changeTab: (tab: number) => void;
};

export const DomainDetailsModal = ({ onClose, onVerify, tab, changeTab, domain }: Props) => {
    const time = epochToRelativeDaysAgo(domain.CreateTime);
    const aliasCount = domain.AliasCount ?? 0;

    const tabs = Object.values(DOMAIN_TABS_ORDER_MAP).map((tab) => {
        switch (tab) {
            case DomainTab.DNS:
                return {
                    name: tab,
                    title: c('Label').t`DNS`,
                    content: <DomainDetailsDNS domain={domain} onVerify={onVerify} />,
                };
            case DomainTab.INFO:
            default:
                return {
                    name: tab,
                    title: c('Label').t`Info`,
                    content: <DomainDetailsInfo domain={domain} />,
                };
        }
    });

    const nameToIndex = (name: string) => {
        const idx = tabs.findIndex((tab) => tab.name === name);
        return idx !== -1 ? idx : 0;
    };

    const activeTab = nameToIndex(tab);

    return (
        <PassModal onClose={onClose} open onReset={onClose} size="xlarge">
            <ModalTwoHeader
                title={domain.Domain}
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
                <Tabs tabs={tabs} value={activeTab} onChange={changeTab} />
            </ModalTwoContent>
        </PassModal>
    );
};
