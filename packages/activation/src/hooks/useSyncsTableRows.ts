import { useMemo } from 'react';

import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { useEasySwitchSelector } from '../logic/store';
import type { Sync } from '../logic/sync/sync.interface';
import { getAllSync } from '../logic/sync/sync.selectors';

interface BYOEAddressEntry {
    address: Address;
    /** Sync linked to the address, if any. A missing sync means the address is disconnected. */
    sync: Sync | undefined;
}

/**
 * Splits what the syncs table displays into:
 * - BYOE addresses, each with its sync when there is one
 * - syncs not tied to a BYOE address (e.g. forwarding), newest first
 */
export const useSyncsTableRows = () => {
    const [addresses = []] = useAddresses();
    const syncs = useEasySwitchSelector(getAllSync);

    return useMemo(() => {
        const syncByEmail = new Map<string, Sync>();
        syncs.forEach((sync) => {
            const email = canonicalizeEmail(sync.account);
            if (!syncByEmail.has(email)) {
                syncByEmail.set(email, sync);
            }
        });

        const byoeEmails = new Set<string>();
        const byoeAddresses: BYOEAddressEntry[] = [];
        addresses.forEach((address) => {
            if (getIsBYOEAddress(address)) {
                const email = canonicalizeEmail(address.Email);
                byoeEmails.add(email);
                byoeAddresses.push({ address, sync: syncByEmail.get(email) });
            }
        });

        const otherSyncs = syncs
            .filter((sync) => !byoeEmails.has(canonicalizeEmail(sync.account)))
            .sort((a, b) => b.startDate - a.startDate);

        return { byoeAddresses, otherSyncs };
    }, [addresses, syncs]);
};
