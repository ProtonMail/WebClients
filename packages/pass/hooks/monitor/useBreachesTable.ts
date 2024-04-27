import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { AddressType, type MonitorAddress } from '@proton/pass/lib/monitor/types';
import { selectAllItems } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export type BreachedUsages = { aliases: number; logins: number };

export type MonitorTableRow<T extends AddressType = AddressType> = MonitorAddress<T> & { usedIn: BreachedUsages };

export type MonitorTable<T extends AddressType = AddressType> = {
    title: string;
    data: MonitorTableRow<T>[];
    loading: boolean;
};

const getEmailUsages = (items: ItemRevision[]) => (email: string) =>
    items.reduce<BreachedUsages>(
        (acc, item) => {
            switch (item.data.type) {
                case 'alias':
                    /* FIXME: we should check the alias options for the presence
                     * of the email in the target mailboxes */
                    break;
                case 'login':
                    if (deobfuscate(item.data.content.username) === email) acc.logins++;
                    break;
            }
            return acc;
        },
        { aliases: 0, logins: 0 }
    );

const getCustomSuggestions = (
    data: MonitorAddress<AddressType.CUSTOM>[],
    items: ItemRevision[]
): MonitorAddress<AddressType.CUSTOM>[] =>
    Object.values(
        items.reduce<Record<string, MonitorAddress<AddressType.CUSTOM>>>((acc, item) => {
            if (item.data.type !== 'login' || !item.data.content.username.v) return acc;
            const username = deobfuscate(item.data.content.username);
            if (!validateEmailAddress(username)) return acc;
            if (data.find(({ email }) => email === username)) return acc;

            acc[username] = {
                addressId: '',
                breachCount: 0,
                breached: false,
                email: username,
                type: AddressType.CUSTOM,
                monitored: false,
                verified: false,
            };
            return acc;
        }, {})
    );

const mapToTableData = <T extends AddressType>(
    data: MonitorAddress<T>[],
    items: ItemRevision[],
    suggestions: MonitorAddress<T>[] = []
): MonitorTableRow<T>[] => {
    const used = getEmailUsages(items);
    return data.concat(suggestions).map((entry) => ({ ...entry, usedIn: used(entry.email) }));
};

export const useBreachesTable = (type: AddressType) => {
    const { breaches, didLoad } = useMonitor();
    const items = useSelector(selectAllItems);

    return useMemo<MonitorTable>(() => {
        switch (type) {
            case AddressType.ALIAS:
                return {
                    title: c('Title').t`Hide-my-email aliases`,
                    data: mapToTableData<AddressType.ALIAS>(breaches.data.alias, items),
                    loading: !didLoad,
                };

            case AddressType.PROTON:
                return {
                    title: c('Title').t`${BRAND_NAME} addresses`,
                    data: mapToTableData<AddressType.PROTON>(breaches.data.proton, items),
                    loading: !didLoad && breaches.loading,
                };

            case AddressType.CUSTOM:
                const suggestions = getCustomSuggestions(breaches.data.custom, items);
                return {
                    title: c('Title').t`Custom emails`,
                    data: mapToTableData<AddressType.CUSTOM>(breaches.data.custom, items, suggestions),
                    loading: !didLoad && breaches.loading,
                };
        }
    }, [breaches, items, didLoad]);
};
