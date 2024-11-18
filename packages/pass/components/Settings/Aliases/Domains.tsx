import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { DefaultDomainSelector } from '@proton/pass/components/Settings/Aliases/DefaultDomainSelector';
import { DomainAddModal } from '@proton/pass/components/Settings/Aliases/DomainAddModal';
import { DomainDeleteModal } from '@proton/pass/components/Settings/Aliases/DomainDeleteModal';
import {
    DOMAIN_TABS_ORDER_MAP,
    DomainDetailsModal,
    DomainTab,
} from '@proton/pass/components/Settings/Aliases/DomainDetailsModal';
import { DomainsTable } from '@proton/pass/components/Settings/Aliases/DomainsTable';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PassPlusIcon } from '@proton/pass/components/Upsell/PassPlusIcon';
import { UpsellRef } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getCustomDomains } from '@proton/pass/store/actions';
import { selectUserPlan } from '@proton/pass/store/selectors';
import type { CustomDomainOutput, CustomDomainSettingsOutput, Maybe, MaybeNull } from '@proton/pass/types';

export type CustomDomainInfo = CustomDomainOutput & Maybe<CustomDomainSettingsOutput>;

type DomainAction =
    | { type: 'add' }
    | ({ type: 'remove' } & CustomDomainOutput)
    | ({ type: DomainTab.DNS } & CustomDomainOutput)
    | ({ type: DomainTab.INFO } & CustomDomainOutput);

export const Domains: FC = () => {
    const [domains, setDomains] = useState<MaybeNull<CustomDomainOutput[]>>(null);
    const [action, setAction] = useState<MaybeNull<DomainAction>>(null);
    const canManageAlias = useSelector(selectUserPlan)?.ManageAlias;

    const spotlight = useSpotlight();

    const getAllDomains = useRequest(getCustomDomains, { onSuccess: setDomains });

    const handleOpenModalDNS = (domain: CustomDomainOutput) => {
        setAction({ type: DomainTab.DNS, ...domain });
    };

    const handleOpenDomainInfo = (domain: CustomDomainOutput) => {
        setAction({ type: DomainTab.INFO, ...domain });
    };

    const handleAddDomainClick = () => {
        if (!canManageAlias) {
            return spotlight.setUpselling({
                type: 'pass-plus',
                upsellRef: UpsellRef.SETTING,
            });
        }

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

    const handleRemoveDomainClick = (domain: CustomDomainOutput) => {
        setAction({ type: 'remove', ...domain });
    };

    const handleRemoved = (domainID: number) => {
        setDomains((domains) => {
            if (!domains) return null;

            return domains.filter((domain) => domain.ID !== domainID);
        });
    };

    const changeTab = (tab: number) => {
        setAction((action) => {
            if (action?.type !== DomainTab.DNS && action?.type !== DomainTab.INFO) return action;

            return { ...action, type: DOMAIN_TABS_ORDER_MAP[tab] };
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
                <div className="text-bold mb-2">{c('Title').t`Select the default domain for aliases`}</div>
                <DefaultDomainSelector className="mb-6" />

                <div className="text-bold mb-2">{c('Title').t`Custom domains`}</div>
                <div>{c('Info')
                    .t`Bring your own domain and you don't have to buy yet another email hosting solution.`}</div>
                <Button color="weak" shape="solid" className="my-2" onClick={handleAddDomainClick}>
                    {c('Action').t`Add custom domain`}
                    {!canManageAlias && <PassPlusIcon className="ml-2" />}
                </Button>
                {domains && domains.length > 0 && (
                    <DomainsTable
                        domains={domains}
                        openModalDNS={handleOpenModalDNS}
                        openModalInfo={handleOpenDomainInfo}
                        handleRemoveDomainClick={handleRemoveDomainClick}
                    />
                )}
            </SettingsPanel>

            {action?.type === 'add' && <DomainAddModal onClose={() => setAction(null)} onSubmit={handleAdded} />}
            {(action?.type === DomainTab.DNS || action?.type === DomainTab.INFO) && (
                <DomainDetailsModal
                    tab={action.type}
                    changeTab={changeTab}
                    onClose={() => setAction(null)}
                    domain={action}
                    onVerify={handleVerifyClick}
                />
            )}
            {action?.type === 'remove' && (
                <DomainDeleteModal domainToDelete={action} onClose={() => setAction(null)} onRemove={handleRemoved} />
            )}
        </>
    );
};
