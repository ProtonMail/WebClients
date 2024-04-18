import { type FC, useRef } from 'react';
import type { List } from 'react-virtualized';

import { c } from 'ttag';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { VirtualList } from '@proton/pass/components/Layout/List/VirtualList';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { useWeakPasswords } from '@proton/pass/hooks/monitor/useWeakPasswords';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';

export const WeakPasswords: FC = () => {
    const weakPasswords = useWeakPasswords();
    const selectItem = useSelectItemAction();
    const listRef = useRef<List>(null);

    return (
        <div className="flex-1 w-full">
            <div className="h-full flex flex-column gap-4 max-w-custom pt-6 px-6" style={{ '--max-w-custom': '74em' }}>
                <SubHeader
                    title={c('Title').t`Weak passwords`}
                    description={c('Description')
                        .t`Weak passwords are easier to guess. Generate strong passwords to keep your accounts safe.`}
                    className="shrink-0"
                />

                {weakPasswords.length > 0 && (
                    <div className="flex-auto">
                        <VirtualList
                            ref={listRef}
                            rowCount={weakPasswords.length}
                            rowHeight={() => 54}
                            rowRenderer={({ style, index, key }) => {
                                const item = weakPasswords[index];
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
