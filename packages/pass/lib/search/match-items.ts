import type {
    DeobfuscatedItemExtraField,
    ExtraFieldType,
    ItemContent,
    ItemExtraField,
    ItemRevision,
    ItemType,
} from '@proton/pass/types';
import { dynMemo } from '@proton/pass/utils/fp/memo';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { normalize } from '@proton/shared/lib/helpers/string';

import type { FieldMatch, ItemMatch, ItemMatchMap } from './types';

/** We used to match on hidden fields but switched over to only text types */
const isFieldTypeSearchable = <F extends { type: ExtraFieldType }>(field: F): field is Extract<F, { type: 'text' }> =>
    field.type === 'text';

const memoNormalize = dynMemo((str: string) => normalize(str, true));
const memoDeobfuscate = dynMemo(deobfuscate);

const matchStr =
    (needle: string) =>
    (haystack: string): boolean => {
        if (needle.length === 0) return false;
        const normalizedHaystack = memoNormalize(haystack);
        return normalizedHaystack.includes(needle);
    };

/** Matches a single field from the item using a getter function,
 * enabling lazy evaluation when used with `combineMatchers`. */
const matchField =
    <T extends ItemType>(getter: (item: ItemRevision<T>) => string): FieldMatch<T> =>
    (item) =>
    (needle) =>
        matchStr(needle)(getter(item));

/** Matches any field from an array returned by the getter function. */
const matchFields =
    <T extends ItemType>(getter: (item: ItemRevision<T>) => string[]): FieldMatch<T> =>
    (item) =>
    (needle) =>
        getter(item).some((field) => matchStr(needle)(field));

/** Matches fields from an `IterableIterator` returned by the getter function.
 * Uses lazy evaluation and early return for efficiency. */
const matchFieldsLazy =
    <T extends ItemType>(getter: (item: ItemRevision<T>) => IterableIterator<string>): FieldMatch<T> =>
    (item) =>
    (needle) => {
        for (const field of getter(item)) if (matchStr(needle)(field)) return true;
        return false;
    };

/** Matches all fields which are of type string in the item content */
const matchContentFields = <T extends ItemType>(getter: (item: ItemRevision<T>) => ItemContent<T>): FieldMatch<T> =>
    matchFieldsLazy(function* (item): IterableIterator<string> {
        const content = getter(item);
        for (const key of Object.keys(content) as (keyof ItemContent<T>)[]) {
            const value = content[key];
            if (typeof value === 'string') yield value;
        }
    });

type ExtraFieldsSources = {
    obfuscated?: ItemExtraField[];
    deobfuscated?: DeobfuscatedItemExtraField[][];
    sections?: { sectionName: string; sectionFields: DeobfuscatedItemExtraField[] }[];
};

/** Matches all kinds of extra fields */
const matchExtraFields = <T extends ItemType>(getter: (item: ItemRevision<T>) => ExtraFieldsSources): FieldMatch<T> =>
    matchFieldsLazy(function* (item): IterableIterator<string> {
        const { obfuscated = [], deobfuscated = [], sections = [] } = getter(item);

        // Extra fields that each content is obfuscated
        for (const field of obfuscated) {
            yield field.fieldName;
            if (isFieldTypeSearchable(field)) yield memoDeobfuscate(field.data.content);
        }

        // Group of extra fields that are already deobfuscated
        for (const group of deobfuscated) {
            if (group === undefined) continue;
            for (const field of group) {
                yield field.fieldName;
                if (isFieldTypeSearchable(field)) yield field.data.content;
            }
        }

        // Sections of extra fields
        for (const section of sections) {
            yield section.sectionName;
            for (const field of section.sectionFields) {
                yield field.fieldName;
                if (isFieldTypeSearchable(field)) yield field.data.content;
            }
        }
    });

/** Combines multiple matchers and checks if any of them match the needles.
 * Uses lazy evaluation and early return via `some` for efficiency.
 * Normalization and deobfuscation are memoized only for multiple needles
 * since searching a single needle has no field reuse across iterations.
 * For multiple needles we iterate over needles first (every) then matchers
 * (some) - meaning fields get normalized/deobfuscated multiple times.
 * Cache is cleared per item to avoid memory leaks */
const combineMatchers =
    <T extends ItemType>(...matchers: FieldMatch<T>[]): ItemMatch<T> =>
    (item) =>
    (needles) => {
        const shouldMemo = needles.length > 1;

        memoNormalize.memo = shouldMemo;
        memoDeobfuscate.memo = shouldMemo;

        const matched = needles.every((needle) => matchers.some((matcher) => matcher(item)(needle)));

        if (shouldMemo) {
            memoNormalize.clear();
            memoDeobfuscate.clear();
        }

        return matched;
    };

const matchesNoteItem: ItemMatch<'note'> = combineMatchers<'note'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => memoDeobfuscate(item.data.metadata.note))
);

const matchesLoginItem: ItemMatch<'login'> = combineMatchers<'login'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => memoDeobfuscate(item.data.content.itemEmail)),
    matchField((item) => memoDeobfuscate(item.data.content.itemUsername)),
    matchField((item) => memoDeobfuscate(item.data.metadata.note)),
    matchFields((item) => item.data.content.urls),
    matchExtraFields((item) => ({ obfuscated: item.data.extraFields }))
);

const matchesAliasItem: ItemMatch<'alias'> = combineMatchers<'alias'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => item.aliasEmail ?? ''),
    matchField((item) => memoDeobfuscate(item.data.metadata.note))
);

const matchesCreditCardItem: ItemMatch<'creditCard'> = combineMatchers<'creditCard'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => item.data.content.cardholderName),
    matchField((item) => memoDeobfuscate(item.data.metadata.note))
);

const matchesIdentityItem: ItemMatch<'identity'> = combineMatchers<'identity'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => memoDeobfuscate(item.data.metadata.note)),
    matchContentFields((item) => item.data.content),
    matchExtraFields((item) => ({
        obfuscated: item.data.extraFields,
        deobfuscated: [
            item.data.content.extraPersonalDetails,
            item.data.content.extraAddressDetails,
            item.data.content.extraContactDetails,
            item.data.content.extraWorkDetails,
        ],
        sections: item.data.content?.extraSections,
    }))
);

const matchesSSHItem: ItemMatch<'sshKey'> = combineMatchers<'sshKey'>(
    matchField((item) => item.data.metadata.name),
    matchExtraFields((item) => ({
        obfuscated: item.data.extraFields,
        sections: item.data.content?.sections,
    }))
);

const matchesWifiItem: ItemMatch<'wifi'> = combineMatchers<'wifi'>(
    matchField((item) => item.data.metadata.name),
    matchExtraFields((item) => ({
        obfuscated: item.data.extraFields,
        sections: item.data.content?.sections,
    }))
);

const matchesCustomItem: ItemMatch<'custom'> = combineMatchers<'custom'>(
    matchField((item) => item.data.metadata.name),
    matchExtraFields((item) => ({
        obfuscated: item.data.extraFields,
        sections: item.data.content?.sections,
    }))
);

/* Each item should expose its own searching mechanism :
 * we may include/exclude certain fields or add extra criteria
 * depending on the type of item we're targeting */
const itemMatchers: ItemMatchMap = {
    login: matchesLoginItem,
    note: matchesNoteItem,
    alias: matchesAliasItem,
    creditCard: matchesCreditCardItem,
    identity: matchesIdentityItem,
    sshKey: matchesSSHItem,
    wifi: matchesWifiItem,
    custom: matchesCustomItem,
};

const matchItem: ItemMatch = <T extends ItemType>(item: ItemRevision<T>) => itemMatchers[item.data.type](item);

export const searchItems = <T extends ItemRevision>(items: T[], search?: string) => {
    if (!search || search.trim() === '') return items;

    /** split the search term into multiple normalized needles */
    const needles = Array.from(new Set(normalize(search, true).split(' ')));
    return items.filter((item) => matchItem(item)(needles));
};
