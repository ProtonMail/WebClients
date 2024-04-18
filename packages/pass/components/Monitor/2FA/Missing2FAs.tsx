import { type FC, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { useMissing2FAs } from '@proton/pass/hooks/monitor/useMissing2FAs';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';

export const Missing2FAs: FC = () => {
    const selectItem = useSelectItemAction();
    const missing2FAsItems = useMissing2FAs();
    const listRef = useRef<List>(null);

    return (
        <div className="flex-1 w-full">
            <div className="h-full flex flex-column gap-4 max-w-custom pt-6 px-6" style={{ '--max-w-custom': '74em' }}>
                <SubHeader
                    title={c('Title').t`Missing two-factor authentication`}
                    description={c('Description')
                        .t`Logins with sites that have two-factor authentication available but you haven’t set it up yet.`}
                    className="shrink-0"
                />

                {missing2FAsItems.length > 0 && (
                    <div className="flex-auto">
                        <VirtualList
                            ref={listRef}
                            rowCount={missing2FAsItems.length}
                            rowHeight={() => 54}
                            rowRenderer={({ style, index, key }) => {
                                const item = missing2FAsItems[index];
                                const id = getItemKey(item);

                                return (
                                    <div style={style} key={key}>
                                        <ItemsListItem
                                            id={id}
                                            item={item}
                                            key={id}
                                            onClick={() => selectItem(item, { inTrash: isTrashed(item) })}
                                        />
                                    </div>
                                );
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
