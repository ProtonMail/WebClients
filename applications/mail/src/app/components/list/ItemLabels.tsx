import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import LabelStack from '@proton/components/components/labelStack/LabelStack';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import { APPLY_LOCATION_TYPES } from '../../hooks/actions/applyLocation/interface';
import { useApplyLocation } from '../../hooks/actions/applyLocation/useApplyLocation';

import { getElementLabels } from '../../helpers/labels';
import type { Element } from '../../models/element';

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
    const history = useHistory();
    const { applyLocation } = useApplyLocation();

    const labelsSorted = useMemo<Label[]>(() => getElementLabels(element, labelID, labels), [element, labelID, labels]);

    if (!labelsSorted.length) {
        return null;
    }

    const handleGo = (label: Label) => () => history.push(`/${label.ID}`);

    const handleUnlabel = (labelID: string) => () => {
        return applyLocation({
            type: APPLY_LOCATION_TYPES.APPLY_LABEL,
            changes: { [labelID]: false },
            elements: [element || ({} as Element)],
            destinationLabelID: labelID,
            removeLabel: true,
        });
    };

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
            className={clsx([className, isCollapsed && 'justify-end'])}
            isStacked={isCollapsed}
            maxNumber={maxNumber}
            showDropDown={showDropdown}
        />
    );
};

export default ItemLabels;
