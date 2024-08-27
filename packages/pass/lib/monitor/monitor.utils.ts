import type { FetchedBreaches } from '@proton/components/containers';
import { isBreached, isMonitored } from '@proton/pass/lib/items/item.predicates';
import type {
    Breach,
    BreachAddressGetResponse,
    BreachCustomEmailGetResponse,
    BreachDomainPeekResponse,
    ItemRevision,
    UniqueItem,
} from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import type { AddressBreachDTO, MonitorAddress, MonitorDomain } from './types';
import { AddressType, BreachFlag } from './types';

export const getDuplicatePasswords = (logins: ItemRevision<'login'>[]): UniqueItem[][] => {
    const duplicatesMap = new Map<string, UniqueItem[]>();
    const seenMap = new Map<string, UniqueItem>();

    logins.forEach(({ data, itemId, shareId }) => {
        if (!data.content.password.v) return;

        const password = deobfuscate(data.content.password);
        const seen = seenMap.get(password);
        let duplicates = duplicatesMap.get(password);

        if (!seen && !duplicates) return seenMap.set(password, { itemId, shareId });

        if (seen) {
            duplicates = duplicates ?? [];
            duplicates.push(seen);
            duplicatesMap.set(password, duplicates);
            seenMap.delete(password);
        }

        duplicates?.push({ itemId, shareId });
    });

    return Array.from(duplicatesMap.values());
};

export const getAddressId = (address: AddressBreachDTO): string => {
    switch (address.type) {
        case AddressType.CUSTOM:
        case AddressType.PROTON:
            return address.addressId;
        case AddressType.ALIAS:
            return `${address.shareId}:${address.itemId}`;
    }
};

export const isBreachedMonitored = ({ Flags }: BreachCustomEmailGetResponse | BreachAddressGetResponse): boolean =>
    (Flags & BreachFlag.MonitorDisabled) !== BreachFlag.MonitorDisabled;

export const intoCustomMonitorAddress = (breach: BreachCustomEmailGetResponse): MonitorAddress<AddressType.CUSTOM> => ({
    addressId: breach.CustomEmailID,
    breachCount: breach.BreachCounter,
    breached: breach.BreachCounter > 0,
    email: breach.Email,
    monitored: isBreachedMonitored(breach),
    type: AddressType.CUSTOM,
    verified: breach.Verified,
    suggestion: false,
});

export const intoProtonMonitorAddress = (breach: BreachAddressGetResponse): MonitorAddress<AddressType.PROTON> => ({
    addressId: breach.AddressID,
    breachCount: breach.BreachCounter,
    breached: breach.BreachCounter > 0,
    breachedAt: breach.LastBreachTime,
    email: breach.Email,
    monitored: isBreachedMonitored(breach),
    type: AddressType.PROTON,
});

export const intoAliasMonitorAddress = (item: ItemRevision<'alias'>): MonitorAddress<AddressType.ALIAS> => ({
    itemId: item.itemId,
    shareId: item.shareId,
    breached: isBreached(item),
    email: item.aliasEmail!,
    monitored: isMonitored(item),
    type: AddressType.ALIAS,
});

export const intoMonitorDomain = ({ Domain, BreachTime }: BreachDomainPeekResponse): MonitorDomain => ({
    domain: Domain,
    breachedAt: BreachTime,
});

export const intoFetchedBreach = (breach: Breach): FetchedBreaches => ({
    id: breach.ID,
    name: breach.Name,
    email: breach.Email,
    severity: breach.Severity,
    createdAt: breach.CreatedAt,
    publishedAt: breach.PublishedAt,
    size: breach.Size ?? 0,
    passwordLastChars: breach.PasswordLastChars ?? null,
    exposedData: breach.ExposedData.map((data) => ({ code: data.Code, name: data.Name, values: data.Values ?? [] })),
    actions: breach.Actions.map((action) => ({
        code: action.Code,
        name: action.Name,
        desc: action.Desc,
        urls: action.Urls,
    })),
    source: {
        isAggregated: breach.Source.IsAggregated,
        domain: breach.Source.Domain ?? null,
        category: null,
        country: null,
    },
    resolvedState: breach.ResolvedState,
});
