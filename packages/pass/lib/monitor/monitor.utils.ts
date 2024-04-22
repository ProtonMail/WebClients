import type { FetchedBreaches } from '@proton/components/containers';
import type { Breach, ItemRevision, UniqueItem } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

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

export const intoFetchedBreach = (breach: Breach): FetchedBreaches => ({
    id: breach.ID,
    name: breach.Name,
    email: breach.Email,
    severity: breach.Severity,
    createdAt: breach.CreatedAt,
    publishedAt: breach.PublishedAt,
    size: breach.Size ?? 0,
    passwordLastChars: breach.PasswordLastChars ?? null,
    exposedData: breach.ExposedData.map((data) => ({ code: data.Code, name: data.Name })),
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
