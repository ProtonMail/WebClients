import { Label } from '@proton/shared/lib/interfaces/Label';

import { Icon, OrderableTableRow } from '../../components';
import ActionsLabel from './ActionsLabel';

interface Props {
    label: Label;
    index: number;
}

function LabelItem({ label, ...rest }: Props) {
    const { Name, Color } = label;

    return (
        <OrderableTableRow
            cells={[
                <div key="label" className="flex flex-nowrap">
                    <Icon name="tag" style={{ fill: Color }} className="icon-16p flex-item-noshrink mr-4 my-auto" />
                    <span className="text-ellipsis" title={Name} data-testid="folders/labels:item-name">
                        {Name}
                    </span>
                </div>,
                <ActionsLabel key="actions" label={label} />,
            ]}
            {...rest}
        />
    );
}

export default LabelItem;
