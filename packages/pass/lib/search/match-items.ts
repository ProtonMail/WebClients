import type { IdentityValues, ItemRevision, ItemType } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { normalize } from '@proton/shared/lib/helpers/string';

import { matchSome } from './match-some';
import type { ItemMatchFunc, ItemMatchFuncMap } from './types';

/** Matches a single field from the item using a getter function,
 * enabling lazy evaluation when used with `combineMatchers`. */
const matchField =
    <T extends ItemType>(getter: (item: ItemRevision<T>) => string): ItemMatchFunc<T> =>
    (item) =>
    (needles) =>
        matchSome(needles)(getter(item));

/** Matches any field from an array returned by the getter function. */
const matchFields =
    <T extends ItemType>(getter: (item: ItemRevision<T>) => string[]): ItemMatchFunc<T> =>
    (item) =>
    (needles) =>
        getter(item).some((field) => matchSome(needles)(field));

/** Matches fields from an `IterableIterator` returned by the getter function.
 * Uses lazy evaluation and early return for efficiency. */
const matchFieldsLazy =
    <T extends ItemType>(getter: (item: ItemRevision<T>) => IterableIterator<string>): ItemMatchFunc<T> =>
    (item) =>
    (needles) => {
        for (const field of getter(item)) if (matchSome(needles)(field)) return true;
        return false;
    };

/** Combines multiple matchers and checks if any of them match the needles.
 * Uses lazy evaluation and early return via `some` for efficiency. */
const combineMatchers =
    <T extends ItemType>(...matchers: ItemMatchFunc<T>[]): ItemMatchFunc<T> =>
    (item) =>
    (needles) =>
        matchers.some((matcher) => matcher(item)(needles));

const matchesNoteItem: ItemMatchFunc<'note'> = combineMatchers<'note'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => deobfuscate(item.data.metadata.note))
);

const matchesLoginItem: ItemMatchFunc<'login'> = combineMatchers<'login'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => deobfuscate(item.data.metadata.note)),
    matchField((item) => deobfuscate(item.data.content.itemEmail)),
    matchField((item) => deobfuscate(item.data.content.itemUsername)),
    matchFields((item) => item.data.content.urls),
    matchFieldsLazy(function* matchExtraFields(item): IterableIterator<string> {
        for (const field of item.data.extraFields) {
            if (field.type !== 'totp') yield `${field.fieldName} ${deobfuscate(field.data.content)}`;
        }
    })
);

const matchesAliasItem: ItemMatchFunc<'alias'> = combineMatchers<'alias'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => deobfuscate(item.data.metadata.note)),
    matchField((item) => item.aliasEmail ?? '')
);

const matchesCreditCardItem: ItemMatchFunc<'creditCard'> = combineMatchers<'creditCard'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => deobfuscate(item.data.metadata.note)),
    matchField((item) => item.data.content.cardholderName),
    matchField((item) => deobfuscate(item.data.content.number))
);

const matchesIdentityItem: ItemMatchFunc<'identity'> = combineMatchers<'identity'>(
    matchField((item) => item.data.metadata.name),
    matchField((item) => deobfuscate(item.data.metadata.note)),
    matchFieldsLazy(function* matchIdentityFields(item): IterableIterator<string> {
        for (const key of Object.keys(item.data.content) as (keyof IdentityValues)[]) {
            const value = item.data.content[key];
            if (typeof value === 'string') yield value;
            else {
                switch (key) {
                    case 'extraAddressDetails':
                    case 'extraContactDetails':
                    case 'extraPersonalDetails':
                    case 'extraWorkDetails': {
                        for (const field of item.data.content[key]) {
                            if (field.type !== 'totp') yield field.data.content;
                        }
                        break;
                    }
                    case 'extraSections': {
                        for (const section of item.data.content[key]) {
                            yield section.sectionName;
                            for (const field of section.sectionFields) {
                                if (field.type !== 'totp') yield field.data.content;
                            }
                        }
                        break;
                    }
                }
            }
        }
    })
);

/* Each item should expose its own searching mechanism :
 * we may include/exclude certain fields or add extra criteria
 * depending on the type of item we're targeting */
const itemMatchers: ItemMatchFuncMap = {
    login: matchesLoginItem,
    note: matchesNoteItem,
    alias: matchesAliasItem,
    creditCard: matchesCreditCardItem,
    identity: matchesIdentityItem,
};

const matchItem: ItemMatchFunc = <T extends ItemType>(item: ItemRevision<T>) => itemMatchers[item.data.type](item);

export const searchItems = <T extends ItemRevision>(items: T[], search?: string) => {
    if (!search || search.trim() === '') return items;

    /** split the search term into multiple normalized needles */
    const needles = normalize(search, true).split(' ');
    return items.filter((item) => matchItem(item)(needles));
};
