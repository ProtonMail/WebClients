import { c } from 'ttag';

import { cardNumberHiddenValue } from '@proton/pass/components/Form/Field/masks/credit-card';
import type { ItemRevision, ItemType } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

type PresentedListItem = { heading: string; subheading: string };
type ItemListPresenterMap = { [T in ItemType]: (revision: ItemRevision<T>) => PresentedListItem };

const itemListPresenter: ItemListPresenterMap = {
    note: ({ data }) => ({
        heading: data.metadata.name,
        subheading: isEmptyString(data.metadata.note.v)
            ? c('Warning').t`Empty note`
            : deobfuscate(data.metadata.note).split('\n')[0],
    }),
    login: ({ data }) => ({
        heading: data.metadata.name,
        subheading: deobfuscate(data.content.itemUsername) || deobfuscate(data.content.itemEmail),
    }),
    alias: ({ data, aliasEmail }) => ({
        heading: data.metadata.name,
        subheading: aliasEmail!,
    }),
    creditCard: ({ data }) => ({
        heading: data.metadata.name,
        subheading: cardNumberHiddenValue(deobfuscate(data.content.number)),
    }),
};

export const presentListItem = <T extends ItemType>(revision: ItemRevision<T>): PresentedListItem =>
    itemListPresenter[revision.data.type](revision);
