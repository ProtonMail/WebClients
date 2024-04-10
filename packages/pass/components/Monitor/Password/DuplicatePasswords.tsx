import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { ItemsListItem } from '@proton/pass/components/Item/List/ItemsListItem';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { selectDuplicatePasswordItems } from '@proton/pass/store/selectors/monitor';

export const DuplicatePasswords: FC = () => {
    const duplicatePasswordItems = useSelector(selectDuplicatePasswordItems);
    const selectItem = useSelectItemAction();

    return (
        <>
            <SubHeader
                title={c('Title').t`Reused passwords`}
                description={c('Description').t`Generate unique passwords to increase your security.`}
            />

            {duplicatePasswordItems.map((group, idx) => {
                return (
                    <div className="flex flex-column" key={`reused-group-${idx}`}>
                        <header className="header flex flex-row flex-nowrap border-bottom h-auto p-4">
                            <h3 className="text-weak text-xl">
                                {c('Title').ngettext(
                                    msgid`Reused ${group.length} time`,
                                    `Reused ${group.length} times`,
                                    group.length
                                )}
                            </h3>
                        </header>
                        <div className="pass-monitor-grid gap-4 py-4">
                            {group.map((item, index) => (
                                <div className="border rounded" key={`duplicate-${index}`}>
                                    <ItemsListItem
                                        item={item}
                                        key={`item-${item.itemId}`}
                                        onClick={() => selectItem(item, { inTrash: isTrashed(item) })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </>
    );
};
