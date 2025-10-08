import { useMemo } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { compoundItemFilters } from '@proton/pass/lib/items/item.utils';
import type { ItemType, ItemTypeFilter } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

type ItemFilterData = { label: string; icon: IconName; itemFilters?: ItemType[] };

type ConditionalItemFilter<T extends boolean> = Omit<Record<ItemTypeFilter, ItemFilterData>, 'custom'> &
    (T extends true ? { custom: ItemFilterData } : { custom?: ItemFilterData });

export const useItemFilters = () => {
    const customItemsEnabled = useFeatureFlag(PassFeature.PassCustomTypeV1);

    return useMemo<ConditionalItemFilter<typeof customItemsEnabled>>(
        () => ({
            '*': {
                label: c('Label').t`All`,
                icon: 'grid-2',
            },
            login: {
                label: c('Label').t`Logins`,
                icon: itemTypeToIconName.login,
            },
            alias: {
                label: c('Label').t`Aliases`,
                icon: itemTypeToIconName.alias,
            },
            creditCard: {
                label: c('Label').t`Cards`,
                icon: itemTypeToIconName.creditCard,
            },
            note: {
                label: c('Label').t`Notes`,
                icon: itemTypeToIconName.note,
            },
            identity: {
                label: c('Label').t`Identities`,
                icon: itemTypeToIconName.identity,
            },
            ...(customItemsEnabled
                ? {
                      custom: {
                          label: c('Label').t`Custom Items`,
                          icon: itemTypeToIconName.custom,
                          itemFilters: compoundItemFilters.custom,
                      },
                  }
                : {}),
        }),
        [customItemsEnabled]
    );
};
