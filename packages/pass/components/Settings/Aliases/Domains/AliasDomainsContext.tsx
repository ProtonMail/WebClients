import { createContext, useMemo } from 'react';

import { createUseContext } from '../../../../hooks/useContextFactory';
import type {
    CustomDomainOutput,
    CustomDomainValidationOutput,
    MaybeNull,
    UserAliasDomainOutput,
    UserAliasSettingsGetOutput,
} from '../../../../types';

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
