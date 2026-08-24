import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { toMap } from '@proton/shared/lib/helpers/object';

import { UpsellRef } from '../../../../constants';
import { useRequest } from '../../../../hooks/useRequest';
import { getAliasDomains, getCustomDomains } from '../../../../store/actions';
import { selectCanManageAlias } from '../../../../store/selectors';
import type { CustomDomainOutput, MaybeNull, UserAliasDomainOutput } from '../../../../types';
import { objectDelete } from '../../../../utils/object/delete';
import { fullMerge, partialMerge } from '../../../../utils/object/merge';
import { useUpselling } from '../../../Upsell/UpsellingProvider';
import { AliasDomainsContext, type AliasDomainsContextValue, type DomainAction } from './AliasDomainsContext';
import { CustomDomainCreateModal } from './CustomDomainCreateModal';
import { CustomDomainDeleteModal } from './CustomDomainDeleteModal';
import { CustomDomainDetailsModal } from './CustomDomainDetailsModal';

export type { CustomDomain, DomainAction } from './AliasDomainsContext';
export { useAliasDomains, useCustomDomain } from './AliasDomainsContext';

export const AliasDomainsProvider: FC<PropsWithChildren> = ({ children }) => {
    const upsell = useUpselling();
    const canManage = useSelector(selectCanManageAlias);

    const [customDomains, setCustomDomains] = useState<Record<number, CustomDomainOutput>>({});
    const [aliasDomains, setAliasDomains] = useState<UserAliasDomainOutput[]>([]);
    const [action, setAction] = useState<MaybeNull<DomainAction>>(null);

    const syncAliasDomains = useRequest(getAliasDomains, { loading: true, onSuccess: setAliasDomains });
    const syncCustomDomains = useRequest(getCustomDomains, {
        loading: true,
        onSuccess: (domains) => setCustomDomains(toMap(domains, 'ID')),
    });

    const loading = syncAliasDomains.loading || syncCustomDomains.loading;

    const context = useMemo<AliasDomainsContextValue>(
        () => ({
            action,
            aliasDomains,
            canManage,
            customDomains: Object.values(customDomains),
            defaultAliasDomain: aliasDomains.find(({ IsDefault }) => IsDefault)?.Domain ?? null,
            loading,
            onCreate: (domain) => {
                setCustomDomains((domains) => fullMerge(domains, { [domain.ID]: domain }));
                setAction({ type: 'dns', domainID: domain.ID });
            },
            onDelete: (domainID) => setCustomDomains((domains) => objectDelete(domains, domainID)),
            onSetDefault: ({ DefaultAliasDomain }) =>
                setAliasDomains((domains) =>
                    domains.map((domain) => ({
                        ...domain,
                        IsDefault: DefaultAliasDomain === domain.Domain,
                    }))
                ),
            onVerify: (domainID, validation) => {
                setCustomDomains((domains) =>
                    partialMerge(domains, {
                        [domainID]: validation,
                    })
                );
                // When a custom domain is verified, add it to the alias domains
                if (validation.MxVerified) {
                    setAliasDomains((aliasDomains) => {
                        const verifiedDomainName = customDomains[domainID].Domain;
                        const alreadyPresent = aliasDomains.some((domain) => domain.Domain === verifiedDomainName);
                        if (alreadyPresent) return aliasDomains;

                        const aliasDomain = {
                            Domain: verifiedDomainName,
                            IsCustom: true,
                            IsPremium: false,
                            MXVerified: true,
                            IsDefault: false,
                        };

                        return [...aliasDomains, aliasDomain];
                    });
                }
            },
            setAction: (action) => {
                switch (action?.type) {
                    case 'create':
                        if (!canManage) upsell({ type: 'pass-plus', upsellRef: UpsellRef.SETTING });
                        else setAction({ type: 'create' });
                        break;
                    default:
                        setAction(action);
                }
            },
        }),
        [action, canManage, customDomains, aliasDomains, loading]
    );

    useEffect(() => {
        syncCustomDomains.dispatch();
        syncAliasDomains.dispatch();
    }, []);

    return (
        <AliasDomainsContext.Provider value={context}>
            {children}
            {(() => {
                switch (action?.type) {
                    case 'create':
                        return <CustomDomainCreateModal />;
                    case 'delete':
                        return <CustomDomainDeleteModal domainID={action.domainID} />;
                    case 'info':
                    case 'dns':
                        return <CustomDomainDetailsModal tab={action.type} domainID={action.domainID} />;
                    default:
                        return null;
                }
            })()}
        </AliasDomainsContext.Provider>
    );
};
