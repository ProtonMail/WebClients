import type { ItemRevision, ItemType } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { matchAny } from './match-any';
import type { ItemMatchFunc, ItemMatchFuncMap } from './types';

export const matchesNoteItem: ItemMatchFunc<'note'> = ({
    data: {
        metadata: { name, note },
    },
}) => matchAny([name, deobfuscate(note)]);

export const matchesLoginItem: ItemMatchFunc<'login'> = ({
    data: {
        metadata: { name, note },
        content: { itemEmail, itemUsername, urls },
        extraFields,
    },
}) =>
    matchAny([
        name,
        deobfuscate(note),
        deobfuscate(itemEmail),
        deobfuscate(itemUsername),
        ...urls,
        ...extraFields.reduce<string[]>((terms, { fieldName, type, data }) => {
            if (type === 'text') terms.push(fieldName, deobfuscate(data.content));
            return terms;
        }, []),
    ]);

export const matchesAliasItem: ItemMatchFunc<'alias'> = ({
    aliasEmail,
    data: {
        metadata: { name, note },
    },
}) => matchAny([name, deobfuscate(note), aliasEmail ?? '']);

export const matchesCreditCardItem: ItemMatchFunc<'creditCard'> = ({
    data: {
        metadata: { name, note },
        content: { cardholderName, number },
    },
}) => matchAny([name, deobfuscate(note), cardholderName, deobfuscate(number)]);

/* Each item should expose its own searching mechanism :
 * we may include/exclude certain fields or add extra criteria
 * depending on the type of item we're targeting */
const itemMatchers: ItemMatchFuncMap = {
    login: matchesLoginItem,
    note: matchesNoteItem,
    alias: matchesAliasItem,
    creditCard: matchesCreditCardItem,
};

export const matchItem: ItemMatchFunc = <T extends ItemType>(item: ItemRevision<T>) =>
    itemMatchers[item.data.type](item);

export const searchItems = <T extends ItemRevision>(items: T[], search?: string) => {
    if (!search || search.trim() === '') return items;
    return items.filter((item) => matchItem(item)(search));
};
