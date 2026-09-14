import { useMemo } from 'react';

import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcGrid2 } from '@proton/icons/icons/IcGrid2';

import { itemTypeToIcon } from '../../components/Layout/Icon/ItemIcon';
import { compoundItemFilters } from '../../lib/items/item.utils';
import type { ItemType, ItemTypeFilter } from '../../types';
import { PassFeature } from '../../types/api/features';
import { useFeatureFlag } from '../useFeatureFlag';

type ItemFilterData = { label: string; icon: IconComponent; itemFilters?: ItemType[] };

type ConditionalItemFilter<T extends boolean> = Omit<Record<ItemTypeFilter, ItemFilterData>, 'custom'> &
    (T extends true ? { custom: ItemFilterData } : { custom?: ItemFilterData });

export const useItemFilters = () => {
    const customItemsEnabled = useFeatureFlag(PassFeature.PassCustomTypeV1);

    return useMemo<ConditionalItemFilter<typeof customItemsEnabled>>(
        () => ({
            '*': {
                label: c('Label').t`All`,
                icon: IcGrid2,
            },
            login: {
                label: c('Label').t`Logins`,
                icon: itemTypeToIcon.login,
            },
            alias: {
                label: c('Label').t`Aliases`,
                icon: itemTypeToIcon.alias,
            },
            creditCard: {
                label: c('Label').t`Cards`,
                icon: itemTypeToIcon.creditCard,
            },
            note: {
                label: c('Label').t`Notes`,
                icon: itemTypeToIcon.note,
            },
            identity: {
                label: c('Label').t`Identities`,
                icon: itemTypeToIcon.identity,
            },
            ...(customItemsEnabled
                ? {
                      custom: {
                          label: c('Label').t`Custom Items`,
                          icon: itemTypeToIcon.custom,
                          itemFilters: compoundItemFilters.custom,
                      },
                  }
                : {}),
        }),
        [customItemsEnabled]
    );
};
