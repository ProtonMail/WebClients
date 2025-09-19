import type {
    WasmAuthenticatorEntryModel,
    WasmLocalEntry,
    WasmRemoteEntry,
} from '@protontech/authenticator-rust-core/worker';
import type { Item } from 'proton-authenticator/lib/db/entities/items';
import { getOrderByIndex } from 'proton-authenticator/lib/entries/ordering';
import { service } from 'proton-authenticator/lib/wasm/service';

import type { MaybeNull } from '@proton/pass/types';

export type EntryAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';
export type EntryType = 'Totp' | 'Steam';
export type WasmRemoteEntryWithKey = WasmRemoteEntry & { keyId: string };

export type EntryDTO = {
    name: string;
    note: string;
    secret: string;
    issuer: string;
    period: number;
    digits: number;
    algorithm: EntryAlgorithm;
    type: EntryType;
};

export type EditEntryDTO = EntryDTO & { id: string };

export const getNowRustTimestamp = () => Math.round(new Date().getTime() / 1_000);

export const toWasmEntry = (item: Omit<Item, 'order'>): WasmAuthenticatorEntryModel => {
    return {
        id: item.id,
        name: item.name,
        uri: item.uri,
        period: item.period,
        issuer: item.issuer,
        secret: item.secret,
        note: item.note,
        entry_type: item.entryType,
    };
};

export const fromWasmEntry = (entry: WasmAuthenticatorEntryModel): Omit<Item, 'order'> => {
    return {
        id: entry.id,
        name: entry.name,
        uri: entry.uri,
        period: entry.period,
        issuer: entry.issuer,
        secret: entry.secret,
        note: entry.note ?? '',
        entryType: entry.entry_type,
    };
};

export const fromWasmEntryOrdered =
    (startAt: number = 0) =>
    (entry: WasmAuthenticatorEntryModel, idx: number): Item => ({
        ...fromWasmEntry(entry),
        order: startAt + getOrderByIndex(idx),
    });

export const fromRemoteWasmEntry = (remoteEntry: WasmRemoteEntryWithKey): Omit<Item, 'order'> => {
    const item = fromWasmEntry(remoteEntry.entry);

    return {
        ...item,
        syncMetadata: {
            entryId: remoteEntry.remote_id,
            revision: remoteEntry.revision,
            modifyTime: remoteEntry.modify_time,
            keyId: remoteEntry.keyId,
            state: 'Synced',
        },
    };
};

export const toLocalWasmEntry = (item: Item): WasmLocalEntry => {
    return {
        entry: toWasmEntry(item),
        state: item.syncMetadata?.state ?? 'PendingSync',
        modify_time: item.syncMetadata?.modifyTime ?? getNowRustTimestamp(),
        local_modify_time: item.syncMetadata?.modifyTime ?? getNowRustTimestamp(),
    };
};

export const getEntryFromValues = (values: EntryDTO): WasmAuthenticatorEntryModel => {
    switch (values.type) {
        case 'Totp':
            return service.new_totp_entry_from_params(values);
        case 'Steam':
            return service.new_steam_entry_from_params(values);
        default:
            throw Error('Unknown entry type');
    }
};

const algorithmIsValid = (algorithm: MaybeNull<string>): algorithm is EntryAlgorithm => {
    const validAlgorithms: EntryAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];
    return validAlgorithms.includes((algorithm ?? '') as EntryAlgorithm);
};

export const getAlgorithmFromUri = (uri: string): MaybeNull<EntryAlgorithm> => {
    const url = new URL(uri);
    const params = new URLSearchParams(url.search);

    const algorithm = params.get('algorithm');

    if (!algorithmIsValid(algorithm)) return null;

    return algorithm;
};

export const getDigitsFromUri = (uri: string): MaybeNull<number> => {
    const url = new URL(uri);
    const params = new URLSearchParams(url.search);

    const digits = params.get('digits');

    if (!digits) return null;

    return Number(digits);
};

export const formatItemName = <T extends { issuer: string; name: string }>(entry: T) => {
    if (!entry.issuer) return entry.name;
    else return `${entry.issuer} - ${entry.name}"`;
};
