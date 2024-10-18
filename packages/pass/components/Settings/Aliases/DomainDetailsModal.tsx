import { c, msgid } from 'ttag';

import { ModalTwoContent, ModalTwoHeader, Tabs } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { DomainDetailsDNS } from '@proton/pass/components/Settings/Aliases/DomainDetailsDNS';
import type { CustomDomainOutput, CustomDomainSettingsOutput } from '@proton/pass/types';
import { epochToRelativeDate } from '@proton/pass/utils/time/format';

export type Props = {
    onClose: () => void;
    onVerify: (domain: CustomDomainOutput) => void;
    domain: CustomDomainOutput | (CustomDomainOutput & CustomDomainSettingsOutput);
    tab: 'info' | 'verify-DNS';
};

export const DomainDetailsModal = ({ onClose, onVerify, tab, domain }: Props) => {
    const time = epochToRelativeDate(domain.CreateTime);
    const aliasCount = domain.AliasCount ?? 0;

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
                <Tabs
                    tabs={[
                        { title: c('Label').t`Info`, content: <></> },
                        { title: c('Label').t`DNS`, content: <DomainDetailsDNS domain={domain} onVerify={onVerify} /> },
                    ]}
                    value={tab === 'info' ? 0 : 1}
                    onChange={() => {}}
                />
            </ModalTwoContent>
        </PassModal>
    );
};
