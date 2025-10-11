import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RouteChildrenProps } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Icon from '@proton/components/components/icon/Icon';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { ItemHistoryPanel } from '@proton/pass/components/Layout/Panel/ItemHistoryPanel';
import { Timeline } from '@proton/pass/components/Layout/Timeline/Timeline';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { isShareWritable } from '@proton/pass/lib/shares/share.predicates';
import { itemDeleteRevisions } from '@proton/pass/store/actions';
import { selectShare } from '@proton/pass/store/selectors';
import { epochToRelativeDaysAgo } from '@proton/pass/utils/time/format';

import { useItemHistory } from './ItemHistoryContext';
import { RevisionItem } from './RevisionItem';

export const RevisionsTimeline: FC<RouteChildrenProps> = ({ location }) => {
    const scope = useItemScope();
    const dispatch = useDispatch();
    const { selectItem, navigate } = useNavigationActions();
    const { item, loading, more, revisions, loadMore } = useItemHistory();
    const { shareId, itemId } = item;
    const [current, ...history] = revisions;
    const share = useSelector(selectShare(shareId));
    const canReset = history.length > 0 && share && isShareWritable(share);

    const reset = useConfirm(() => {
        dispatch(itemDeleteRevisions.intent({ shareId, itemId }));
        selectItem(shareId, itemId, { mode: 'replace', scope });
    });

    return (
        <ItemHistoryPanel
            type={item.data.type}
            title={
                <div className="flex flex-nowrap items-center gap-4">
                    <Button
                        key="back-button"
                        icon
                        pill
                        shape="solid"
                        color="weak"
                        className="shrink-0"
                        onClick={() => selectItem(shareId, itemId, { scope })}
                        title={c('Action').t`Close`}
                    >
                        <Icon name="cross" alt={c('Action').t`Close`} />
                    </Button>
                    <h2 className="text-2xl text-bold text-ellipsis mb-0-5">{c('Title').t`History`}</h2>
                </div>
            }
            actions={
                canReset
                    ? [
                          <Button
                              key="reset-button"
                              className="text-sm"
                              pill
                              shape="outline"
                              color="danger"
                              onClick={() => reset.prompt(true)}
                          >
                              <Icon name="clock-rotate-left" className="mr-1" />
                              <span>{c('Action').t`Reset history`}</span>
                          </Button>,
                      ]
                    : undefined
            }
        >
            {(() => {
                if (!current) {
                    return (
                        <div className="absolute inset-center anime-fade-in">
                            {loading ? (
                                <CircleLoader size="small" />
                            ) : (
                                <span className="max-w-2/3 color-weak">{c('Error').t`Something went wrong`}</span>
                            )}
                        </div>
                    );
                }

                return (
                    <>
                        {current.data.type === 'login' && (
                            <CardContent
                                icon="magic-wand"
                                className="mb-3"
                                title={c('Title').t`Last autofill`}
                                ellipsis
                                subtitle={
                                    // translator: when this login was last used
                                    current.lastUseTime
                                        ? epochToRelativeDaysAgo(current.lastUseTime)
                                        : c('Info').t`Never`
                                }
                            />
                        )}

                        <Timeline>
                            <RevisionItem
                                icon="clock"
                                title={c('Title').t`Current version`}
                                subtitle={epochToRelativeDaysAgo(current.revisionTime)}
                                ellipsis
                            />

                            {history.map((item) => (
                                <RevisionItem
                                    key={item.revision}
                                    onClick={() => navigate(`${location.pathname}/${item.revision}`)}
                                    icon={item.revision === 1 ? 'bolt' : 'pencil'}
                                    title={item.revision === 1 ? c('Title').t`Created` : c('Title').t`Modified`}
                                    subtitle={epochToRelativeDaysAgo(item.revisionTime)}
                                    ellipsis
                                />
                            ))}
                        </Timeline>

                        {more && (
                            <Button
                                shape="ghost"
                                className="mt-2 flex flex-nowrap items-center gap-2"
                                color="norm"
                                onClick={loadMore}
                                disabled={loading}
                                loading={loading}
                            >
                                <Icon name="chevron-down" />
                                <span>{c('Action').t`View older history`}</span>
                            </Button>
                        )}
                    </>
                );
            })()}

            {reset.pending && (
                <ConfirmationModal
                    open
                    onClose={reset.cancel}
                    onSubmit={reset.confirm}
                    submitText={c('Action').t`Reset`}
                    title={c('Title').t`Reset history for this item?`}
                >
                    <Card type="danger" className="text-sm">
                        {c('Info')
                            .t`Resetting history will permanently delete all past item versions and cannot be undone.`}
                    </Card>
                </ConfirmationModal>
            )}
        </ItemHistoryPanel>
    );
};
