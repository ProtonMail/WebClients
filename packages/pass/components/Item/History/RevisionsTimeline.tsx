import { type FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { Icon } from '@proton/components';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { ItemHistoryPanel } from '@proton/pass/components/Layout/Panel/ItemHistoryPanel';
import { Timeline } from '@proton/pass/components/Layout/Timeline/Timeline';
import { useItemRoute } from '@proton/pass/components/Navigation/ItemRouteContext';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { epochToRelativeDate } from '@proton/pass/utils/time/format';

import { useItemHistory } from './ItemHistoryContext';
import { RevisionItem } from './RevisionItem';

export const RevisionsTimeline: FC<RouteChildrenProps> = ({ location }) => {
    const { prefix } = useItemRoute();
    const { selectItem, navigate, matchTrash } = useNavigation();
    const { item, loading, more, revisions, loadMore } = useItemHistory();
    const { shareId, itemId } = item;
    const [current, ...history] = revisions;

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
                        onClick={() => selectItem(shareId, itemId, { inTrash: matchTrash, prefix })}
                        title={c('Action').t`Close`}
                    >
                        <Icon name="cross" alt={c('Action').t`Close`} />
                    </Button>
                    <h2 className="text-2xl text-bold text-ellipsis mb-0-5">{c('Title').t`History`}</h2>
                </div>
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
                                    current.lastUseTime ? epochToRelativeDate(current.lastUseTime) : c('Info').t`Never`
                                }
                            />
                        )}

                        <Timeline>
                            <RevisionItem
                                icon="clock"
                                title={c('Title').t`Current version`}
                                subtitle={epochToRelativeDate(current.revisionTime)}
                                ellipsis
                            />

                            {history.map((item) => (
                                <RevisionItem
                                    key={item.revision}
                                    onClick={() => navigate(`${location.pathname}/${item.revision}`)}
                                    icon={item.revision === 1 ? 'bolt' : 'pencil'}
                                    title={item.revision === 1 ? c('Title').t`Created` : c('Title').t`Modified`}
                                    subtitle={epochToRelativeDate(item.revisionTime)}
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
        </ItemHistoryPanel>
    );
};
