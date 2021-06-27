import { c } from 'ttag';
import { SortableContainerProps } from 'react-sortable-hoc';

import { Label } from '@proton/shared/lib/interfaces/Label';

import { OrderableTable, OrderableTableBody, OrderableTableHeader, Icon } from '../../components';
import LabelSortableItem from './LabelSortableItem';

interface Props extends SortableContainerProps {
    items: Label[];
}

function LabelSortableList({ items, ...rest }: Props) {
    return (
        <OrderableTable className="no-border simple-table--has-actions border-collapse mt1" {...rest}>
            <caption className="sr-only">{c('Settings/labels').t`Labels/Folders`}</caption>
            <OrderableTableHeader>
                <tr>
                    <th scope="col" className="w5">
                        <Icon name="arrows-up-down-left-right" />
                    </th>
                    <th scope="col" className="w70">
                        {c('Settings/labels - table').t`Labels`}
                    </th>
                    <th scope="col">{c('Settings/labels - table').t`Actions`}</th>
                </tr>
            </OrderableTableHeader>
            <OrderableTableBody colSpan={0}>
                {items.map((label, index) => (
                    <LabelSortableItem
                        key={`item-${label.ID}`}
                        index={index}
                        label={label}
                        data-test-id="folders/labels:item-type:label"
                    />
                ))}
            </OrderableTableBody>
        </OrderableTable>
    );
}

export default LabelSortableList;
