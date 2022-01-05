import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { classnames, LabelStack } from '@proton/components';
import { toMap } from '@proton/shared/lib/helpers/object';
import { orderBy } from '@proton/shared/lib/helpers/array';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { useHistory } from 'react-router-dom';

import { Element } from '../../models/element';
import { getLabelIDs } from '../../helpers/elements';
import { useApplyLabels } from '../../hooks/useApplyLabels';

interface Props {
    element?: Element;
    labelID: string;
    labels?: Label[];
    showUnlabel?: boolean;
    className?: string;
    isCollapsed?: boolean;
    maxNumber?: number;
}

const ItemLabels = ({
    element,
    labelID,
    showUnlabel = false,
    labels = [],
    className = '',
    isCollapsed = true,
    maxNumber,
}: Props) => {
    const applyLabels = useApplyLabels();

    const labelIDs = Object.keys(getLabelIDs(element, labelID));
    const labelsMap = toMap(labels);
    const labelsObjects = labelIDs.map((ID) => labelsMap[ID]).filter(isTruthy);
    const labelsSorted = orderBy(labelsObjects, 'Order') as Label[];

    const history = useHistory();

    if (!labelsSorted.length) {
        return null;
    }

    const handleGo = (label: Label) => () => history.push(`/${label.ID}`);

    const handleUnlabel = (labelID: string) => () => applyLabels([element || ({} as Element)], { [labelID]: false });
    const labelsDescription = labelsSorted.map((label) => ({
        name: label.Name,
        color: label.Color,
        title: label.Name,
        onClick: handleGo(label),
        onDelete: handleUnlabel(label.ID),
    }));

    return (
        <LabelStack
            labels={labelsDescription}
            className={classnames([className, isCollapsed && 'flex-justify-end'])}
            isStacked={isCollapsed}
            showDelete={showUnlabel}
            maxNumber={maxNumber}
        />
    );
};

export default ItemLabels;
