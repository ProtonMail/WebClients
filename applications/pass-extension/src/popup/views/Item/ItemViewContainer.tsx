import { type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { selectByShareId, selectItemWithOptimistic, selectShareOrThrow } from '@proton/pass/store';
import selectFailedAction from '@proton/pass/store/optimistic/selectors/select-failed-action';
import type { SelectedItem, ShareType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import { getItemActionId } from '@proton/pass/utils/pass/items';

import { Panel } from '../../components/Panel/Panel';
import { ItemView } from './Item/Item.view';

export const ItemViewContainer: VFC = () => {
    const { shareId, itemId } = useParams<SelectedItem>();

    const itemSelector = useMemo(() => selectItemWithOptimistic(shareId, itemId), [shareId, itemId]);
    const vault = useSelector(selectShareOrThrow<ShareType.Vault>(shareId));
    const item = useSelector(itemSelector);

    const optimisticItemId = getItemActionId({ itemId, shareId });
    const failedItemActionSelector = pipe(selectByShareId, selectFailedAction(optimisticItemId));
    const failure = useSelector(failedItemActionSelector);

    if (item !== undefined) {
        return <ItemView item={item} vault={vault} shareId={shareId} itemId={itemId} failureAction={failure?.action} />;
    }

    return <Panel />;
};
