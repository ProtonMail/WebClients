import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { MAX_CUSTOM_ADDRESSES } from '@proton/pass/constants';
import { filterItemsByUsername } from '@proton/pass/lib/items/item.utils';
import { AddressType, type MonitorAddress } from '@proton/pass/lib/monitor/types';
import { selectLoginItems, selectNonAliasedLoginItems } from '@proton/pass/store/selectors';
import type { LoginItem } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export type MonitorTableRow<T extends AddressType = AddressType> = MonitorAddress<T> & { usageCount: number };

export type MonitorTable<T extends AddressType = AddressType> = {
    title: string;
    data: MonitorTableRow<T>[];
    loading: boolean;
};

/** Given a list of login items candidates and already monitored
 * emails - returns a suggestion list of the top 5 most used logins */
const getCustomSuggestions = (data: MonitorAddress[], items: LoginItem[]): MonitorTableRow<AddressType.CUSTOM>[] => {
    const monitored = new Set<string>(data.map(prop('email')));

    const suggestions = items.reduce<Map<string, number>>((acc, item) => {
        if (!item.data.content.username.v) return acc;
        const username = deobfuscate(item.data.content.username);
        if (monitored.has(username)) return acc;
        if (validateEmailAddress(username)) acc.set(username, (acc.get(username) ?? 0) + 1);

        return acc;
    }, new Map());

    return Array.from(suggestions.entries())
        .map<MonitorTableRow<AddressType.CUSTOM>>(([email, usageCount]) => ({
            addressId: '',
            breachCount: 0,
            breached: false,
            email,
            monitored: false,
            suggestion: true,
            type: AddressType.CUSTOM,
            usageCount,
            verified: false,
        }))
        .sort(sortOn('usageCount', 'DESC'));
};

const getRowPriority = (row: MonitorTableRow) => {
    if ('verified' in row && !row.verified) return -1;
    if (row.breached || row.monitored) return 1;
    if (!row.monitored) return 0;
    return -1;
};

const mapToRow = <T extends AddressType>(data: MonitorAddress<T>[], items: LoginItem[]): MonitorTableRow<T>[] =>
    data
        .map((entry) => ({ ...entry, usageCount: filterItemsByUsername(entry.email)(items).length }))
        .sort((a, b) => getRowPriority(b) - getRowPriority(a));

export const useBreachesTable = (type: AddressType) => {
    const { breaches, didLoad } = useMonitor();
    const { alias, custom, proton } = breaches.data;
    const logins = useSelector(selectLoginItems);
    const nonAliasedLogins = useSelector(selectNonAliasedLoginItems);

    return useMemo<MonitorTable>(() => {
        switch (type) {
            case AddressType.ALIAS:
                return {
                    title: c('Title').t`Hide-my-email aliases`,
                    data: mapToRow<AddressType.ALIAS>(alias, logins),
                    loading: false,
                };

            case AddressType.PROTON:
                return {
                    title: c('Title').t`${BRAND_NAME} addresses`,
                    data: mapToRow<AddressType.PROTON>(proton, logins),
                    loading: !didLoad && breaches.loading,
                };

            case AddressType.CUSTOM:
                const monitored = [alias, custom, proton].flat();
                const suggestionsCount = custom.length >= MAX_CUSTOM_ADDRESSES ? 0 : 3;
                const suggestions = getCustomSuggestions(monitored, nonAliasedLogins).slice(0, suggestionsCount);

                return {
                    title: c('Title').t`Custom emails`,
                    data: mapToRow<AddressType.CUSTOM>(breaches.data.custom, logins).concat(suggestions),
                    loading: !didLoad && breaches.loading,
                };
        }
    }, [breaches, logins, didLoad]);
};
