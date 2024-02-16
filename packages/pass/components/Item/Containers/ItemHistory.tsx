import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon } from '@proton/components/index';
import { AliasView } from '@proton/pass/components/Item/Alias/Alias.view';
import { CreditCardView } from '@proton/pass/components/Item/CreditCard/CreditCard.view';
import { HistoryItem } from '@proton/pass/components/Item/History/HistoryItem';
import { RevisionsListItem } from '@proton/pass/components/Item/History/RevisionsListItem';
import { LoginView } from '@proton/pass/components/Item/Login/Login.view';
import { NoteView } from '@proton/pass/components/Item/Note/Note.view';
import { ItemHistoryPanel } from '@proton/pass/components/Layout/Panel/ItemHistoryPanel';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, maybeTrash } from '@proton/pass/components/Navigation/routing';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useItemHistory } from '@proton/pass/hooks/useItemHistory';
import { selectItemByShareIdAndId, selectShare } from '@proton/pass/store/selectors';
import type { ItemRevision, ItemType, MaybeNull, SelectedItem, ShareType } from '@proton/pass/types';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

// TODO: replace below with new component reusing the ItemView components to view previous item revision
const itemTypeViewMap: { [T in ItemType]: FC<ItemViewProps<T>> } = {
    login: LoginView,
    note: NoteView,
    alias: AliasView,
    creditCard: CreditCardView,
};

const pageSize = 20;

export const ItemHistory: FC = () => {
    const { shareId, itemId } = useParams<SelectedItem>();
    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const { selectItem, preserveSearch, matchTrash } = useNavigation();
    const [revision, setRevision] = useState<MaybeNull<ItemRevision>>(null);

    const itemSelector = useMemo(() => selectItemByShareIdAndId(shareId, itemId), [shareId, itemId]);
    const item = useSelector(itemSelector);

    const { state, loadMore } = useItemHistory({ shareId, itemId, pageSize });
    const { revisions, loading } = state;

    /* if vault and item cannot be found: redirect to base path */
    if (!(vault && item)) {
        const to = preserveSearch(getLocalPath(maybeTrash('', matchTrash)));
        return <Redirect to={to} push={false} />;
    }

    /* BE has an edge case where they will return a token to load next page even if there is no more revision to load
     * (when the amount of revisions returned is equal to the pageSize), so we check here if we already loaded all revisions */
    const canLoadMore = state.revisions.length < item.revision && state.next !== null;

    const ItemTypeViewComponent = itemTypeViewMap[item.data.type] as FC<ItemViewProps>;

    return revision === null ? (
        <ItemHistoryPanel
            type={item.data.type}
            title={c('Title').t`History`}
            leftActions={[
                <Button
                    key="cancel-button"
                    icon
                    pill
                    shape="solid"
                    color="weak"
                    onClick={() => selectItem(shareId, itemId)}
                    title={c('Action').t`Cancel`}
                >
                    <Icon name="cross" alt={c('Action').t`Cancel`} />
                </Button>,
            ]}
        >
            {loading && revisions.length === 0 && <CircleLoader size="small" className="ml-2" />}

            {revisions[0] && (
                <RevisionsListItem className="mb-3">
                    <HistoryItem
                        icon="clock"
                        title={c('Title').t`Current version`}
                        subtitle={getFormattedDateFromTimestamp(revisions[0].revisionTime)}
                    />
                </RevisionsListItem>
            )}
            {revisions.slice(1).map((item) => (
                <RevisionsListItem key={item.revision} className="mb-3" onClick={() => setRevision(item)}>
                    <HistoryItem
                        icon={item.revision === 1 ? 'bolt' : 'pencil'}
                        title={item.revision === 1 ? c('Title').t`Created` : c('Title').t`Modified`}
                        subtitle={getFormattedDateFromTimestamp(item.revisionTime)}
                    />
                </RevisionsListItem>
            ))}
            {canLoadMore && (
                <Button shape="ghost" className="mt-2" color="norm" onClick={loadMore} disabled={loading}>
                    {c('Action').t`View older history`}
                    {loading ? (
                        <CircleLoader size="small" className="ml-2" />
                    ) : (
                        <Icon name="chevron-down" className="ml-2" />
                    )}
                </Button>
            )}
        </ItemHistoryPanel>
    ) : (
        // TODO: replace below with new component to view previous item revision
        // @ts-ignore
        <ItemTypeViewComponent revision={revision} vault={vault} />
    );
};
