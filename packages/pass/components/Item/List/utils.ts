import { c } from 'ttag';

import { intoUserIdentifier } from '../../../lib/items/item.utils';
import type { ItemRevision, ItemType } from '../../../types';
import { deobfuscate, deobfuscateCCField } from '../../../utils/obfuscate/xor';
import { cardNumberHiddenValue } from '../../Form/Field/masks/credit-card';

type PresentedListItem = { heading: string; subheading: string };
type ItemListPresenterMap = { [T in ItemType]: (revision: ItemRevision<T>) => PresentedListItem };

const itemListPresenter: ItemListPresenterMap = {
    note: ({ data }) => ({
        heading: data.metadata.name,
        subheading:
            data.metadata.note.v.length === 0
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
