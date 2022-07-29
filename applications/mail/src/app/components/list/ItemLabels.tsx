import { useHistory } from 'react-router-dom';

import { LabelStack, classnames } from '@proton/components';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Label } from '@proton/shared/lib/interfaces/Label';
import isTruthy from '@proton/utils/isTruthy';
import orderBy from '@proton/utils/orderBy';

import { getLabelIDs } from '../../helpers/elements';
import { useApplyLabels } from '../../hooks/useApplyLabels';
import { Element } from '../../models/element';

interface Props {
    element?: Element;
    labelID: string;
    labels?: Label[];
    className?: string;
    isCollapsed?: boolean;
    maxNumber?: number;
    showDropdown?: boolean;
}

const ItemLabels = ({
    element,
    labelID,
    labels = [],
    className = '',
    isCollapsed = true,
    maxNumber,
    showDropdown = true,
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
            maxNumber={maxNumber}
            showDropDown={showDropdown}
        />
    );
};

export default ItemLabels;
