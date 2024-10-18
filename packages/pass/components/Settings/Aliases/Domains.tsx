import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { DomainAddModal } from '@proton/pass/components/Settings/Aliases/DomainAddModal';
import { DomainDetailsModal } from '@proton/pass/components/Settings/Aliases/DomainDetailsModal';
import { DomainsTable } from '@proton/pass/components/Settings/Aliases/DomainsTable';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { getCustomDomains } from '@proton/pass/store/actions';
import { selectUserPlan } from '@proton/pass/store/selectors';
import type { CustomDomainOutput, CustomDomainSettingsOutput, MaybeNull } from '@proton/pass/types';

type DomainAction =
    | { type: 'add' }
    | ({ type: 'verify-DNS' } & CustomDomainOutput)
    | ({ type: 'info' } & CustomDomainOutput & CustomDomainSettingsOutput);

export const Domains: FC = () => {
    const [domains, setDomains] = useState<MaybeNull<CustomDomainOutput[]>>(null);
    const [action, setAction] = useState<MaybeNull<DomainAction>>(null);
    const canManageAlias = useSelector(selectUserPlan)?.ManageAlias;

    const getAllDomains = useActionRequest(getCustomDomains.intent, {
        onSuccess: ({ data }: { data: CustomDomainOutput[] }) => {
            setDomains(data);
        },
    });

    const handleOpenModalDNS = (domain: CustomDomainOutput) => {
        setAction({ type: 'verify-DNS', ...domain });
    };

    const handleAddDomainClick = () => {
        setAction({ type: 'add' });
    };

    const handleAdded = (domain: CustomDomainOutput) => {
        setDomains((domains) => (domains ? [...domains, domain] : [domain]));
        handleOpenModalDNS(domain);
    };

    const handleVerifyClick = (updatedDomain: CustomDomainOutput) => {
        setDomains((domains) => {
            if (!domains) return [updatedDomain];

            return domains.map((domain) => {
                if (domain.ID === updatedDomain.ID) {
                    return updatedDomain;
                }
                return domain;
            });
        });
    };

    useEffect(() => {
        getAllDomains.dispatch();
    }, []);

    // If action contains a domain state, keep it up to date when the domains list changes
    useEffect(() => {
        setAction((action) => {
            if (!action || action.type === 'add') return action;

            const updatedDomain = domains?.find((domain) => domain.ID === action.ID);
            return { ...action, ...updatedDomain };
        });
    }, [domains]);

    return (
        <>
            <SettingsPanel title={c('Label').t`Domains`} className="flex-1" contentClassname="pt-4 pb-2">
                <div className="text-bold mb-2">{c('Title').t`Custom domains`}</div>
                <div>{c('Info')
                    .t`Bring your own domain and you don't have to buy yet another email hosting solution.`}</div>
                <Button
                    color="weak"
                    shape="solid"
                    className="my-2"
                    onClick={handleAddDomainClick}
                    disabled={!canManageAlias}
                >{c('Action').t`Add custom domain`}</Button>
                {domains && domains.length > 0 && <DomainsTable domains={domains} openModalDNS={handleOpenModalDNS} />}
            </SettingsPanel>

            {action?.type === 'add' && <DomainAddModal onClose={() => setAction(null)} onSubmit={handleAdded} />}
            {(action?.type === 'verify-DNS' || action?.type === 'info') && (
                <DomainDetailsModal
                    tab={action.type}
                    onClose={() => setAction(null)}
                    domain={action}
                    onVerify={handleVerifyClick}
                />
            )}
        </>
    );
};
