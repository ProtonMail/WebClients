import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { ItemHistoryRestore } from '@proton/pass/components/Item/History/ItemHistoryRestore';
import { ItemHistoryTimeline } from '@proton/pass/components/Item/History/ItemHistoryTimeline';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, maybeTrash } from '@proton/pass/components/Navigation/routing';
import { selectItemByShareIdAndId } from '@proton/pass/store/selectors';
import type { ItemRevision, MaybeNull, SelectedItem } from '@proton/pass/types';

export const ItemHistory: FC = () => {
    const { shareId, itemId } = useParams<SelectedItem>();
    const { preserveSearch, matchTrash } = useNavigation();
    const itemSelector = useMemo(() => selectItemByShareIdAndId(shareId, itemId), [shareId, itemId]);
    const item = useSelector(itemSelector);

    const [revision, setRevision] = useState<MaybeNull<ItemRevision>>(null);

    /* if item cannot be found: redirect to base path */
    if (!item) {
        const to = preserveSearch(getLocalPath(maybeTrash('', matchTrash)));
        return <Redirect to={to} push={false} />;
    }

    return revision === null ? (
        <ItemHistoryTimeline onSelectRevision={setRevision} item={item} />
    ) : (
        <ItemHistoryRestore previousRevision={revision} currentRevision={item} onClose={() => setRevision(null)} />
    );
};
