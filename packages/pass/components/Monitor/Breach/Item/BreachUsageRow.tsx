import type { FC, MouseEvent } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { useSelectItem } from '@proton/pass/components/Navigation/NavigationActions';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import type { LoginItem } from '@proton/pass/types';
import { formatEpoch } from '@proton/pass/utils/time/format';

type Props = { item: LoginItem };

export const BreachUsageRow: FC<Props> = ({ item }) => {
    const { shareId, itemId } = item;
    const selectItem = useSelectItem();

    const handleClick = (evt: MouseEvent) => {
        evt.stopPropagation();
        selectItem(shareId, itemId, { scope: isTrashed(item) ? 'trash' : 'share' });
    };

    return (
        <TableRow className="pass-table--row" onClick={handleClick}>
            <TableCell>
                <div className="flex flex-nowrap items-center gap-3">
                    <SafeItemIcon item={item} size={4.5} />
                    <span className="text-ellipsis">{item.data.metadata.name}</span>
                </div>
            </TableCell>
            <TableCell className="text-ellipsis">{formatEpoch('MMM d, yyyy')(item.modifyTime)}</TableCell>
            <TableCell>
                <div className="flex justify-end">
                    <Button pill size="small" shape="ghost" type="button" onClick={handleClick}>
                        <Icon name="chevron-right" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};
