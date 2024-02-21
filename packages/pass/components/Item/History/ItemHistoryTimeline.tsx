import { type FC } from 'react';
import { useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon } from '@proton/components/index';
import timelineBottom from '@proton/pass/assets/history/timeline-bottom.svg';
import timelineMiddle from '@proton/pass/assets/history/timeline-middle.svg';
import timelineTop from '@proton/pass/assets/history/timeline-top.svg';
import { HistoryItem } from '@proton/pass/components/Item/History/HistoryItem';
import { RevisionsListItem } from '@proton/pass/components/Item/History/RevisionsListItem';
import { ItemHistoryPanel } from '@proton/pass/components/Layout/Panel/ItemHistoryPanel';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { useItemHistory } from '@proton/pass/hooks/useItemHistory';
import type { ItemRevision, SelectedItem } from '@proton/pass/types';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

const pageSize = 20;

type Props = {
    item: ItemRevision;
    onSelectRevision: (revision: ItemRevision) => void;
};

export const ItemHistoryTimeline: FC<Props> = ({ item, onSelectRevision }) => {
    const { shareId, itemId } = useParams<SelectedItem>();
    const { selectItem } = useNavigation();

    const { state, loadMore } = useItemHistory({ shareId, itemId, pageSize });
    const { revisions, loading } = state;

    /* BE has an edge case where they will return a token to load next page even if there is no more revision to load
     * (when the amount of revisions returned is equal to the pageSize), so we check here if we already loaded all revisions */
    const canLoadMore = state.revisions.length < item.revision && state.next !== null;

    return (
        <ItemHistoryPanel
            type={item.data.type}
            title={
                <div className="flex flex-nowrap items-center gap-4">
                    <Button
                        key="cancel-button"
                        icon
                        pill
                        shape="solid"
                        color="weak"
                        className="shrink-0"
                        onClick={() => selectItem(shareId, itemId)}
                        title={c('Action').t`Cancel`}
                    >
                        <Icon name="cross" alt={c('Action').t`Cancel`} />
                    </Button>
                    <h2 className="text-2xl text-bold text-ellipsis mb-0-5">{c('Title').t`History`}</h2>
                </div>
            }
        >
            {item.data.type === 'login' && (
                <>
                    <HistoryItem
                        icon="magic-wand"
                        className="mb-3"
                        title={c('Title').t`Last autofill`}
                        subtitle={
                            // translator: when this login was last used
                            item.lastUseTime ? getFormattedDateFromTimestamp(item.lastUseTime) : c('Info').t`Never`
                        }
                    />

                    <div className="mb-3">{c('Title').t`Changelog`}</div>
                </>
            )}

            {loading && revisions.length === 0 && <CircleLoader size="small" className="ml-2" />}

            {revisions[0] && (
                <div className="flex items-center flex-nowrap mt-3 gap-2">
                    {revisions.length > 1 && <img src={timelineTop} alt="" className="shrink-0" />}
                    <RevisionsListItem className="mb-3">
                        <HistoryItem
                            icon="clock"
                            title={c('Title').t`Current version`}
                            subtitle={getFormattedDateFromTimestamp(revisions[0].revisionTime)}
                        />
                    </RevisionsListItem>
                </div>
            )}
            {revisions.slice(1).map((item, index) => (
                <div key={item.revision} className="flex items-center flex-nowrap gap-2">
                    <img
                        src={index === revisions.length - 2 ? timelineBottom : timelineMiddle}
                        alt=""
                        className="shrink-0"
                    />
                    <RevisionsListItem className="mb-3" onClick={() => onSelectRevision(item)}>
                        <HistoryItem
                            icon={item.revision === 1 ? 'bolt' : 'pencil'}
                            title={item.revision === 1 ? c('Title').t`Created` : c('Title').t`Modified`}
                            subtitle={getFormattedDateFromTimestamp(item.revisionTime)}
                        />
                    </RevisionsListItem>
                </div>
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
    );
};
