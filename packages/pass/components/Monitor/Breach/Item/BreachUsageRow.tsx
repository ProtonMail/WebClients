import type { FC, MouseEvent } from 'react';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { TableCell, TableRow } from '@proton/components/components/table';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import type { LoginItem } from '@proton/pass/types';
import { formatEpoch } from '@proton/pass/utils/time/format';

type Props = { item: LoginItem };

export const BreachUsageRow: FC<Props> = ({ item }) => {
    const { shareId, itemId } = item;
    const { selectItem } = useNavigation();

    const handleClick = (evt: MouseEvent) => {
        evt.stopPropagation();
        selectItem(shareId, itemId, { inTrash: isTrashed(item) });
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
