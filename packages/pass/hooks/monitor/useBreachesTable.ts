import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import type { MonitorContextValue } from '@proton/pass/components/Monitor/MonitorContext';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { MAX_CUSTOM_ADDRESSES } from '@proton/pass/constants';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import { filterItemsByUserIdentifier } from '@proton/pass/lib/items/item.utils';
import { AddressType, type MonitorAddress } from '@proton/pass/lib/monitor/types';
import { selectLoginItems, selectNonAliasedLoginItems } from '@proton/pass/store/selectors';
import type { ItemRevision, LoginItem, MaybeNull } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { toLowerCase } from '@proton/pass/utils/string/to-lower-case';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export type MonitorTableRow<T extends AddressType = AddressType> = MonitorAddress<T> & { usageCount: number };

export type MonitorTable<T extends AddressType = AddressType> = {
    title: string;
    data: MonitorTableRow<T>[];
    loading: boolean;
};

/** Given a list of login items candidates and already monitored
 * emails - returns a suggestion list of logins sorted by usage count */
const getCustomSuggestions = async (
    data: MonitorAddress[],
    items: LoginItem[]
): Promise<MonitorTableRow<AddressType.CUSTOM>[]> => {
    const monitored = new Set<string>(data.map(pipe(prop('email'), toLowerCase)));
    const suggestions = new Map<string, number>();

    for (const item of items) {
        if (!item.data.content.itemEmail.v) continue;
        const email = toLowerCase(deobfuscate(item.data.content.itemEmail));
        if (monitored.has(email)) continue;
        if (await PassUI.is_email_valid(email)) suggestions.set(email, (suggestions.get(email) ?? 0) + 1);
    }

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

/** Order should be :
 * ¹ breached monitored items sorted by `breachCount` (¹)
 * ² non-breached monitored items
 * ³ paused items
 * ⁴ unverified items */
const getRowPriority = (row: MonitorTableRow) => {
    if ('verified' in row && !row.verified) return -1; /* (⁴) */
    if (!row.monitored) return 0; /* (³) */
    if (row.breached) return (row.breachCount ?? 1) + 1; /* (¹) */
    if (row.monitored) return 1; /* (²) */

    return -1;
};

export const sortMonitorTableRows = <T extends AddressType>(rows: MonitorTableRow<T>[]): MonitorTableRow<T>[] =>
    rows.sort((a, b) => getRowPriority(b) - getRowPriority(a));

const mapToRow = <T extends AddressType>(data: MonitorAddress<T>[], items: LoginItem[]): MonitorTableRow<T>[] =>
    data
        .map((entry) => ({ ...entry, usageCount: filterItemsByUserIdentifier(entry.email)(items).length }))
        .sort((a, b) => getRowPriority(b) - getRowPriority(a));

const getBreachesTable = async (
    type: AddressType,
    monitor: MonitorContextValue,
    logins: ItemRevision<'login'>[],
    nonAliasedLogins: ItemRevision<'login'>[]
): Promise<MonitorTable> => {
    const { breaches, didLoad } = monitor;
    const { alias, custom, proton } = breaches.data;

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
            const suggestions = (await getCustomSuggestions(monitored, nonAliasedLogins)).slice(0, suggestionsCount);

            return {
                title: c('Title').t`Custom emails`,
                data: mapToRow<AddressType.CUSTOM>(breaches.data.custom, logins).concat(suggestions),
                loading: !didLoad && breaches.loading,
            };
    }
};

export const useBreachesTable = (type: AddressType): MaybeNull<MonitorTable> => {
    const monitor = useMonitor();

    const [table, setTable] = useState<MaybeNull<MonitorTable>>(null);
    const logins = useSelector(selectLoginItems);
    const nonAliasedLogins = useSelector(selectNonAliasedLoginItems);

    useEffect(() => {
        getBreachesTable(type, monitor, logins, nonAliasedLogins).then(setTable).catch(noop);
    }, [type, monitor.breaches, monitor.didLoad, logins, nonAliasedLogins]);

    return table;
};
