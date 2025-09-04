import type { FC, PropsWithChildren } from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getAliasDomains, getCustomDomains } from '@proton/pass/store/actions';
import { selectCanManageAlias } from '@proton/pass/store/selectors';
import type {
    CustomDomainOutput,
    CustomDomainValidationOutput,
    MaybeNull,
    UserAliasDomainOutput,
    UserAliasSettingsGetOutput,
} from '@proton/pass/types';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { fullMerge, partialMerge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

import { CustomDomainCreateModal } from './CustomDomainCreateModal';
import { CustomDomainDeleteModal } from './CustomDomainDeleteModal';
import { CustomDomainDetailsModal } from './CustomDomainDetailsModal';

export type DomainAction =
    | { type: 'create' }
    | { type: 'delete'; domainID: number }
    | { type: 'dns'; domainID: number }
    | { type: 'info'; domainID: number };

export type CustomDomain = CustomDomainOutput & Partial<CustomDomainValidationOutput>;

export interface AliasDomainsContextValue {
    action: MaybeNull<DomainAction>;
    aliasDomains: UserAliasDomainOutput[];
    canManage: boolean;
    customDomains: CustomDomain[];
    defaultAliasDomain: MaybeNull<string>;
    loading: boolean;
    onCreate: (domain: CustomDomainOutput) => void;
    onDelete: (domainID: number) => void;
    onVerify: (domainID: number, validation: CustomDomainValidationOutput) => void;
    onSetDefault: (data: UserAliasSettingsGetOutput) => void;
    setAction: (action: MaybeNull<DomainAction>) => void;
}

export const AliasDomainsContext = createContext<MaybeNull<AliasDomainsContextValue>>(null);
export const useAliasDomains = createUseContext(AliasDomainsContext);

export const useCustomDomain = (domainID: number) => {
    const { customDomains } = useAliasDomains();
    return useMemo(() => customDomains.find((domain) => domain.ID === domainID), [customDomains, domainID]);
};

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
