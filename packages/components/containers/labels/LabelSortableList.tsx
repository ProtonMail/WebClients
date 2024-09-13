import type { SortableContainerProps } from 'react-sortable-hoc';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import { OrderableTable, OrderableTableBody, OrderableTableHeader } from '../../components';
import LabelSortableItem from './LabelSortableItem';

interface Props extends SortableContainerProps {
    items: Label[];
}

function LabelSortableList({ items, ...rest }: Props) {
    // 17 is the number of elements before we have more than 50rem, will be replaced soon by a fix in scroll component
    return (
        <Scroll className={clsx('overflow-hidden', items.length > 17 && 'h-custom')} style={{ '--h-custom': '50rem' }}>
            <OrderableTable className="border-none simple-table--has-actions border-collapse mt-4 " {...rest}>
                <caption className="sr-only">{c('Settings/labels').t`Labels/Folders`}</caption>
                <OrderableTableHeader>
                    <tr>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '5%' }}>
                            <Icon name="arrows-cross" alt={c('Settings/labels - table').t`Drag to reorder`} />
                        </th>
                        <th scope="col">{c('Settings/labels - table').t`Labels`}</th>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '10em' }}>{c(
                            'Settings/labels - table'
                        ).t`Actions`}</th>
                    </tr>
                </OrderableTableHeader>
                <OrderableTableBody colSpan={0}>
                    {items.map((label, index) => (
                        <LabelSortableItem
                            key={`item-${label.ID}`}
                            index={index}
                            label={label}
                            data-testid="folders/labels:item-type:label"
                        />
                    ))}
                </OrderableTableBody>
            </OrderableTable>
        </Scroll>
    );
}

export default LabelSortableList;
