import { Label } from '@proton/shared/lib/interfaces/Label';

import { OrderableTableRow, Icon } from '../../components';

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
                    <Icon
                        name="tag"
                        style={{ fill: Color }}
                        className="icon-16p flex-item-noshrink mr1 mtauto mbauto"
                    />
                    <span className="text-ellipsis" title={Name} data-test-id="folders/labels:item-name">
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
