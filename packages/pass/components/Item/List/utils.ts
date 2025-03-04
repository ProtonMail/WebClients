import { c } from 'ttag';

import { cardNumberHiddenValue } from '@proton/pass/components/Form/Field/masks/credit-card';
import { intoUserIdentifier } from '@proton/pass/lib/items/item.utils';
import type { ItemRevision, ItemType } from '@proton/pass/types';
import { deobfuscate, deobfuscateCCField } from '@proton/pass/utils/obfuscate/xor';
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
    login: (item) => ({
        heading: item.data.metadata.name,
        subheading: intoUserIdentifier(item),
    }),
    alias: ({ data, aliasEmail }) => ({
        heading: data.metadata.name,
        subheading: aliasEmail!,
    }),
    creditCard: ({ data }) => ({
        heading: data.metadata.name,
        subheading: cardNumberHiddenValue(deobfuscateCCField(data.content.number, true)),
    }),
    identity: ({ data }) => ({
        heading: data.metadata.name,
        subheading: '',
    }),
    sshKey: ({ data }) => ({
        heading: data.metadata.name,
        subheading: '',
    }),
    wifi: ({ data }) => ({
        heading: data.metadata.name,
        subheading: '',
    }),
    custom: ({ data }) => ({
        heading: data.metadata.name,
        subheading: '',
    }),
};

export const presentListItem = <T extends ItemType>(revision: ItemRevision<T>): PresentedListItem =>
    itemListPresenter[revision.data.type](revision);
