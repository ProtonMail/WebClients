import { c } from 'ttag';

import type { ItemRevision, ItemType } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string';

import { cardNumberHiddenValue } from '../../popup/components/Field/masks/credit-card';

type PresentedListItem = { heading: string; subheading: string };
type ItemListPresenterMap = { [T in ItemType]: (revision: ItemRevision<T>) => PresentedListItem };

const itemListPresenter: ItemListPresenterMap = {
    note: ({ data }) => ({
        heading: data.metadata.name,
        subheading: isEmptyString(data.metadata.note) ? c('Warning').t`Empty note` : data.metadata.note,
    }),
    login: ({ data }) => ({
        heading: data.metadata.name,
        subheading: data.content.username,
    }),
    alias: ({ data, aliasEmail }) => ({
        heading: data.metadata.name,
        subheading: aliasEmail!,
    }),
    creditCard: ({ data }) => ({
        heading: data.metadata.name,
        subheading: cardNumberHiddenValue(data.content.number),
    }),
};

export const presentListItem = <T extends ItemType>(revision: ItemRevision<T>): PresentedListItem =>
    itemListPresenter[revision.data.type](revision);
