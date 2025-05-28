import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { SelectedItem } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

export const useItemViewInfo = ({ shareId, itemId }: SelectedItem) => {
    const share = useSelector(selectShareOrThrow(shareId));

    const getMoreInfoList = useCallback(
        (revision: number) =>
            [
                { label: c('Label').t`Modified`, values: [getOccurrenceString(revision)] },
                { label: c('Label').t`Item ID`, values: [itemId] },
                { label: c('Label').t`Share ID`, values: [shareId] },
                { label: c('Label').t`Vault ID`, values: [share.vaultId] },
            ].filter(truthy),
        [share]
    );

    return { getMoreInfoList };
};
